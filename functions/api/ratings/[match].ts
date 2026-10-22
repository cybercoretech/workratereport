// Fan ratings for one match: GET the average/count (and yours), PUT to rate
// (0–5 in quarter steps), DELETE to remove your rating.
import { fail, json, type Env } from '../../_lib/env';
import { allow, currentMember, now } from '../../_lib/members';

async function knownMatch(env: Env, request: Request, id: string) {
  if (!/^[a-z0-9-]{3,100}$/.test(id)) return false;
  const res = await env.ASSETS.fetch(new URL('/data/catalog.json', request.url));
  const c = (await res.json()) as { matches: { id: string }[] };
  return c.matches.some((m) => m.id === id);
}
async function summary(env: Env, id: string, memberId?: string) {
  const agg = await env.DB.prepare('SELECT COUNT(*) AS n, AVG(rating) AS avg FROM fan_ratings WHERE match_id = ?1').bind(id).first<{ n: number; avg: number | null }>();
  const mine = memberId ? await env.DB.prepare('SELECT rating FROM fan_ratings WHERE match_id = ?1 AND member = ?2').bind(id, memberId).first<{ rating: number }>() : null;
  return { count: agg?.n ?? 0, average: agg?.avg === null || agg?.avg === undefined ? null : Math.round(agg.avg * 100) / 100, mine: mine?.rating ?? null };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = String(params.match);
  const m = await currentMember(env, request);
  return json({ ok: true, ...(await summary(env, id, m?.id)), signedIn: Boolean(m) });
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail(403, 'Bad origin');
  const m = await currentMember(env, request);
  if (!m) return fail(401, 'Sign in to rate matches');
  const id = String(params.match);
  if (!(await knownMatch(env, request, id))) return fail(404, 'Unknown match');
  if (!(await allow(env, `rate:${m.id}`, 60, 3600))) return fail(429, 'Too many ratings in an hour. Try again later.');
  let r: number;
  try { r = Number(((await request.json()) as { rating?: unknown }).rating); } catch { return fail(400, 'Bad JSON'); }
  if (!Number.isFinite(r) || r < 0 || r > 5 || Math.round(r * 4) !== r * 4) return fail(422, 'Rate from 0 to 5 in quarter stars');
  const t = now();
  await env.DB.prepare(`INSERT INTO fan_ratings (member, match_id, rating, created, updated) VALUES (?1, ?2, ?3, ?4, ?4)
    ON CONFLICT(member, match_id) DO UPDATE SET rating = ?3, updated = ?4`).bind(m.id, id, r, t).run();
  return json({ ok: true, ...(await summary(env, id, m.id)), signedIn: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return fail(403, 'Bad origin');
  const m = await currentMember(env, request);
  if (!m) return fail(401, 'Sign in first');
  const id = String(params.match);
  await env.DB.prepare('DELETE FROM fan_ratings WHERE member = ?1 AND match_id = ?2').bind(m.id, id).run();
  return json({ ok: true, ...(await summary(env, id, m.id)), signedIn: true });
};
