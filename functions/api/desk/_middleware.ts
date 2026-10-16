// Guards every /api/desk/* route: configuration, same-origin writes, and a
// valid session (except for login itself).
import { fail, type Env } from '../../_lib/env';
import { hasSession } from '../../_lib/session';

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  const url = new URL(request.url);
  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) {
    return fail(503, 'The desk is not configured yet (missing ADMIN_PASSWORD_HASH or SESSION_SECRET).');
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // CSRF: browsers always send Origin on cross-site POST/PUT; require ours.
    if (request.headers.get('origin') !== url.origin) return fail(403, 'Bad origin');
    if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) return fail(415, 'Send JSON');
  }
  if (url.pathname !== '/api/desk/login' && !(await hasSession(request, env.SESSION_SECRET))) {
    return fail(401, 'Not signed in');
  }
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('cache-control', 'no-store');
  out.headers.set('x-robots-tag', 'noindex');
  return out;
};
