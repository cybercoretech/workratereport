// Step 1 of Google sign-in: authorization-code flow with PKCE (S256) and a
// one-use state bound to this browser by a short-lived cookie.
import { fail, type Env } from '../../_lib/env';
import { b64url } from '../../_lib/crypto';
import { allow, now, randomToken, safeReturn, sha256 } from '../../_lib/members';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail(503, 'Google sign-in is not configured yet.');
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  if (!(await allow(env, `auth:${ip}`, 20, 600))) return fail(429, 'Too many sign-in attempts. Try again in a few minutes.');
  const url = new URL(request.url);
  const state = randomToken(24), verifier = randomToken(48), browser = randomToken(24);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  await env.DB.batch([
    env.DB.prepare('INSERT INTO oauth_states (state, browser_hash, verifier, return_to, expires) VALUES (?1, ?2, ?3, ?4, ?5)')
      .bind(state, await sha256(browser), verifier, safeReturn(url.searchParams.get('return')), now() + 600),
    env.DB.prepare('DELETE FROM oauth_states WHERE expires < ?1').bind(now()),
  ]);
  const auth = new URL(env.GOOGLE_AUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth');
  Object.entries({
    client_id: env.GOOGLE_CLIENT_ID, redirect_uri: `${url.origin}/api/auth/callback`, response_type: 'code',
    scope: 'openid email', state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
  }).forEach(([k, v]) => auth.searchParams.set(k, v));
  return new Response(null, { status: 302, headers: {
    location: auth.toString(), 'cache-control': 'no-store',
    'set-cookie': `wr_oauth=${browser}; Path=/api/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  } });
};
