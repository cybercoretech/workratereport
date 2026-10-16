import { json, type Env } from '../../_lib/env';

// Reaching this handler means the middleware accepted the session.
export const onRequestGet: PagesFunction<Env> = async ({ env }) =>
  json({ ok: true, publishing: Boolean(env.DESK_GITHUB_TOKEN), branch: env.CONTENT_BRANCH, repo: env.CONTENT_REPO });
