// Pretty profile URLs: /u/<handle> and /u/<handle>/ serve the static profile
// shell (/u/index.html), which loads the member from /api/members/<handle>.
import type { Env } from '../_lib/env';
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const res = await env.ASSETS.fetch(new URL('/u/', request.url));
  return new Response(res.body, { status: res.status, headers: res.headers });
};
