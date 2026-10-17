// The signed-in member's own profile: GET to read, PATCH to update.
import { fail, json, type Env } from '../_lib/env';
import { AVATARS, allow, currentMember, now, publicMember } from '../_lib/members';

const RESERVED = new Set(['admin', 'administrator', 'mod', 'moderator', 'staff', 'workrate', 'workratereport', 'desk', 'support', 'official', 'meltzer']);
const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n) : undefined);

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const m = await currentMember(env, request);
  if (!m) return json({ ok: true, member: null, google: Boolean(env.GOOGLE_CLIENT_ID) });
  return json({ ok: true, member: { ...publicMember(m), visibility: m.visibility } });
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail(403, 'Bad origin');
  const m = await currentMember(env, request);
  if (!m) return fail(401, 'Sign in first');
  if (!(await allow(env, `profile:${m.id}`, 30, 3600))) return fail(429, 'Too many profile changes. Try again later.');
  let b: Record<string, unknown>;
  try { b = await request.json(); } catch { return fail(400, 'Bad JSON'); }
  const errors: string[] = [];
  const set: Record<string, unknown> = {};
  if (b.handle !== undefined) {
    const h = String(b.handle).trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(h)) errors.push('Handle: 3–24 letters, numbers, - or _, starting with a letter or number');
    else if (RESERVED.has(h)) errors.push('That handle is reserved');
    else if (h !== m.handle && (await env.DB.prepare('SELECT 1 FROM members WHERE handle = ?1').bind(h).first())) errors.push('That handle is taken');
    else set.handle = h;
  }
  const text: [string, number][] = [['display_name', 40], ['bio', 500], ['favorite_era', 40], ['favorite_promotion', 60], ['favorite_wrestler', 60]];
  for (const [k, n] of text) if (b[k] !== undefined) set[k] = clip(b[k], n) ?? '';
  if (b.avatar !== undefined) {
    const a = String(b.avatar).replace(/^preset:/, '');
    if (AVATARS.includes(a)) set.avatar = `preset:${a}`; else errors.push('Pick one of the avatars');
  }
  if (b.watching_since !== undefined) {
    const y = b.watching_since === null || b.watching_since === '' ? null : Number(b.watching_since);
    if (y !== null && (!Number.isInteger(y) || y < 1940 || y > new Date().getUTCFullYear())) errors.push('Watching since: a year between 1940 and now');
    else set.watching_since = y;
  }
  if (b.visibility !== undefined) {
    if (['public', 'members', 'private'].includes(String(b.visibility))) set.visibility = b.visibility; else errors.push('Visibility must be public, members or private');
  }
  if (errors.length) return fail(422, 'Please fix these first', { errors });
  const keys = Object.keys(set);
  if (keys.length) {
    await env.DB.prepare(`UPDATE members SET ${keys.map((k, i) => `${k} = ?${i + 1}`).join(', ')}, updated = ?${keys.length + 1} WHERE id = ?${keys.length + 2}`)
      .bind(...keys.map((k) => set[k]), now(), m.id).run();
  }
  const fresh = await env.DB.prepare('SELECT * FROM members WHERE id = ?1').bind(m.id).first();
  return json({ ok: true, member: { ...publicMember(fresh as never), visibility: (fresh as { visibility: string }).visibility } });
};
