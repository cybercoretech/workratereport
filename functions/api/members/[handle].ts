// A member's public profile, respecting their visibility setting.
import { fail, json, type Env } from '../../_lib/env';
import { currentMember, publicMember, type Member } from '../../_lib/members';

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const handle = String(params.handle).toLowerCase();
  const m = await env.DB.prepare('SELECT * FROM members WHERE handle = ?1 AND banned = 0').bind(handle).first<Member>();
  if (!m) return fail(404, 'No member with that handle');
  const viewer = await currentMember(env, request);
  const self = viewer?.id === m.id;
  if (!self && (m.visibility === 'private' || (m.visibility === 'members' && !viewer))) {
    return json({ ok: true, member: { handle: m.handle, display_name: m.display_name || m.handle, avatar: m.avatar, hidden: true } });
  }
  const { results } = await env.DB.prepare('SELECT match_id, rating, updated FROM fan_ratings WHERE member = ?1 ORDER BY updated DESC LIMIT 50').bind(m.id).all();
  return json({ ok: true, member: publicMember(m), ratings: results, self });
};
