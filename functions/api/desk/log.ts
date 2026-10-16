import { json, type Env } from '../../_lib/env';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { results } = await env.DB.prepare('SELECT at, path, commit_sha, title FROM desk_publish_log ORDER BY at DESC LIMIT 25').all();
  return json({ ok: true, entries: results });
};
