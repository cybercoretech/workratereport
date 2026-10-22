import { json, type Env } from '../../_lib/env';
import { endMemberSession } from '../../_lib/members';
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ ok: false, error: 'Bad origin' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': await endMemberSession(env, request) });
};
