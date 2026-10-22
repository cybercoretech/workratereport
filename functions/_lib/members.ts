// Member sessions: random token in an HttpOnly cookie, SHA-256 hash in D1.
import type { Env } from './env';
import { b64url } from './crypto';

export const MEMBER_COOKIE = 'wr_member';
export const SESSION_DAYS = 90;
export const now = () => Math.floor(Date.now() / 1000);

export async function sha256(s: string) {
  return b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
}
export const randomToken = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));

export function cookie(request: Request, name: string) {
  return (request.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;
}

export interface Member {
  id: string; handle: string; display_name: string; bio: string; avatar: string;
  favorite_era: string; favorite_promotion: string; favorite_wrestler: string; watching_since: number | null;
  visibility: string; role: string; banned: number; created: number; google_sub: string;
}

export async function currentMember(env: Env, request: Request): Promise<Member | null> {
  const token = cookie(request, MEMBER_COOKIE);
  if (!token || token.length > 100) return null;
  const row = await env.DB.prepare(
    `SELECT m.* FROM member_sessions s JOIN members m ON m.id = s.member WHERE s.token_hash = ?1 AND s.expires > ?2`,
  ).bind(await sha256(token), now()).first<Member>();
  if (!row || row.banned) return null;
  return row;
}

export async function createMemberSession(env: Env, memberId: string) {
  const token = randomToken();
  const t = now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO member_sessions (token_hash, member, created, expires) VALUES (?1, ?2, ?3, ?4)').bind(await sha256(token), memberId, t, t + SESSION_DAYS * 86400),
    env.DB.prepare('DELETE FROM member_sessions WHERE expires < ?1').bind(t),
  ]);
  return `${MEMBER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

export async function endMemberSession(env: Env, request: Request) {
  const token = cookie(request, MEMBER_COOKIE);
  if (token) await env.DB.prepare('DELETE FROM member_sessions WHERE token_hash = ?1').bind(await sha256(token)).run();
  return `${MEMBER_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

/** Fixed-window limiter. Returns false when the bucket is over its limit. */
export async function allow(env: Env, bucket: string, limit: number, windowSecs: number) {
  const t = now();
  const w = t - (t % windowSecs);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (bucket, window, count) VALUES (?1, ?2, 1)
     ON CONFLICT(bucket) DO UPDATE SET count = CASE WHEN window = ?2 THEN count + 1 ELSE 1 END, window = ?2
     RETURNING count`,
  ).bind(bucket, w).first<{ count: number }>();
  return (row?.count ?? 1) <= limit;
}

/** The public view of a member (never email or google_sub). */
export const publicMember = (m: Member) => ({
  handle: m.handle, display_name: m.display_name || m.handle, bio: m.bio, avatar: m.avatar,
  favorite_era: m.favorite_era, favorite_promotion: m.favorite_promotion, favorite_wrestler: m.favorite_wrestler,
  watching_since: m.watching_since, role: m.role, joined: m.created,
});

export const AVATARS = ['belt', 'mask', 'bell', 'mic', 'chair', 'ropes', 'boots', 'turnbuckle'];

/** Same-origin path only: blocks open redirects. */
export const safeReturn = (v: string | null) => (v && /^\/(?!\/)[\w\-./?=&%#]*$/.test(v) ? v : '/');
