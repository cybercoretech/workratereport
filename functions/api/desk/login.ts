import { fail, json, type Env } from '../../_lib/env';
import { verifyPassword } from '../../_lib/crypto';
import { createSession } from '../../_lib/session';

const WINDOW = 15 * 60;      // seconds
const PER_IP = 5;            // failures per IP per window
const GLOBAL = 50;           // failures from everyone per window

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const now = Math.floor(Date.now() / 1000);
  const since = now - WINDOW;
  const { mine, all } = (await env.DB.prepare(
    `SELECT SUM(CASE WHEN ip = ?1 THEN 1 ELSE 0 END) AS mine, COUNT(*) AS all_
       FROM desk_login_attempts WHERE ok = 0 AND at > ?2`,
  ).bind(ip, since).first<{ mine: number | null; all_: number }>().then((r) => ({ mine: r?.mine ?? 0, all: r?.all_ ?? 0 })));
  if (mine >= PER_IP || all >= GLOBAL) {
    return fail(429, 'Too many failed attempts. Try again in 15 minutes.', { retryAfter: WINDOW });
  }

  let password = '';
  try { password = String(((await request.json()) as { password?: unknown }).password ?? ''); } catch { /* bad JSON */ }
  const ok = password.length > 0 && password.length <= 256 && (await verifyPassword(password, env.ADMIN_PASSWORD_HASH!));

  await env.DB.batch([
    env.DB.prepare('INSERT INTO desk_login_attempts (ip, at, ok) VALUES (?1, ?2, ?3)').bind(ip, now, ok ? 1 : 0),
    env.DB.prepare('DELETE FROM desk_login_attempts WHERE at < ?1').bind(now - 30 * 86400),
  ]);
  if (!ok) return fail(401, 'Wrong password', { attemptsLeft: Math.max(0, PER_IP - mine - 1) });
  return json({ ok: true }, 200, { 'set-cookie': await createSession(env.SESSION_SECRET!) });
};
