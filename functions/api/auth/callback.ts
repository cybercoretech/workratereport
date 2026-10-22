// Step 2 of Google sign-in: check the one-use state belongs to this browser,
// swap the code (with the PKCE verifier) for tokens, read the verified
// account, then find or create the member and start a session.
import type { Env } from '../../_lib/env';
import { cookie, createMemberSession, now, randomToken, sha256 } from '../../_lib/members';

const page = (msg: string, status = 400) => new Response(
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign-in problem</title><body style="font:16px system-ui;background:#111014;color:#f3eee3;padding:40px"><h1>Sign-in didn't work</h1><p>${msg}</p><p><a style="color:#d4a537" href="/account/">Try again</a></p>`,
  { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  if (url.searchParams.get('error')) return page('Google sign-in was cancelled.');
  const state = url.searchParams.get('state') ?? '', code = url.searchParams.get('code') ?? '';
  const browser = cookie(request, 'wr_oauth');
  if (!state || !code || !browser) return page('This sign-in link has expired. Please start again.');
  // One use: delete and read in one step.
  const row = await env.DB.prepare('DELETE FROM oauth_states WHERE state = ?1 RETURNING browser_hash, verifier, return_to, expires')
    .bind(state).first<{ browser_hash: string; verifier: string; return_to: string; expires: number }>();
  if (!row || row.expires < now() || row.browser_hash !== (await sha256(browser))) return page('This sign-in link has expired. Please start again.');

  const tokenRes = await fetch(env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID!, client_secret: env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${url.origin}/api/auth/callback`, grant_type: 'authorization_code', code_verifier: row.verifier }),
  });
  if (!tokenRes.ok) return page('Google didn\'t accept the sign-in. Please start again.', 502);
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  const infoRes = await fetch(env.GOOGLE_USERINFO_URL || 'https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) return page('Couldn\'t read your Google account. Please start again.', 502);
  const info = (await infoRes.json()) as { sub?: string; email?: string; email_verified?: boolean };
  if (!info.sub || !info.email || info.email_verified !== true) return page('Your Google account needs a verified email address.');

  // Access tokens and names are never stored. Email is kept privately.
  let member = await env.DB.prepare('SELECT id, banned FROM members WHERE google_sub = ?1').bind(info.sub).first<{ id: string; banned: number }>();
  if (member?.banned) return page('This account has been suspended.', 403);
  if (!member) {
    const id = randomToken(12), t = now();
    let handle = '';
    for (let i = 0; i < 5 && !handle; i++) {
      const candidate = `fan-${randomToken(4).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 6) || i}`;
      if (!(await env.DB.prepare('SELECT 1 FROM members WHERE handle = ?1').bind(candidate).first())) handle = candidate;
    }
    const role = env.ADMIN_GOOGLE_SUB && info.sub === env.ADMIN_GOOGLE_SUB ? 'admin' : 'member';
    await env.DB.prepare('INSERT INTO members (id, google_sub, email, handle, role, created, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)')
      .bind(id, info.sub, info.email, handle || `fan-${id.slice(0, 8)}`, role, t).run();
    member = { id, banned: 0 };
    row.return_to = '/account/?welcome=1';
  } else {
    await env.DB.prepare('UPDATE members SET email = ?1, role = CASE WHEN ?2 THEN \'admin\' ELSE role END WHERE id = ?3')
      .bind(info.email, env.ADMIN_GOOGLE_SUB ? info.sub === env.ADMIN_GOOGLE_SUB : false, member.id).run();
  }
  const headers = new Headers({ location: row.return_to, 'cache-control': 'no-store' });
  headers.append('set-cookie', await createMemberSession(env, member.id));
  headers.append('set-cookie', 'wr_oauth=; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(null, { status: 302, headers });
};
