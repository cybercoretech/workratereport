import { fail, json, type Env } from '../../_lib/env';
import { matchFile, matchSlug, validateMatch } from '../../_lib/content';
import { loadCatalog } from '../../_lib/catalog';
import { GitHubError, getFile, putFile } from '../../_lib/github';

interface Body { id?: string; data?: Record<string, unknown>; body?: string; create?: boolean }

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try { return await handle(ctx); } catch (e) {
    if (e instanceof GitHubError) { console.error('desk/match publish:', e.message); return fail(502, e.message); }
    throw e;
  }
};

const handle: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DESK_GITHUB_TOKEN) return fail(503, 'Publishing is not configured yet (missing DESK_GITHUB_TOKEN).');
  let input: Body;
  try { input = (await request.json()) as Body; } catch { return fail(400, 'Bad JSON'); }
  const review = typeof input.body === 'string' ? input.body : '';
  if (review.length > 60_000) return fail(400, 'Review is too long (60,000 characters max)');

  const cat = await loadCatalog(env, request);
  // Wrestlers just added from the desk: confirm on GitHub, then treat as known.
  const ws = Array.isArray(input.data?.wrestlers) ? (input.data!.wrestlers as unknown[]).map(String) : [];
  for (const w of ws) if (!cat.wrestlers.includes(w) && (await cat.check('wrestlers', w))) cat.wrestlers.push(w);

  const { data, errors } = validateMatch(input.data ?? {}, cat);
  if (errors.length) return fail(422, 'Please fix these first', { errors });

  const id = input.id && /^[a-z0-9-]{3,100}$/.test(input.id) ? input.id : matchSlug(data);
  const path = `src/content/matches/${id}.md`;
  const existing = await getFile(env, path);
  if (input.create && existing) return fail(409, `A match file "${id}" already exists. Open it from the list to edit it.`);

  const text = matchFile(data, review);
  if (existing && existing.text === text) return json({ ok: true, id, unchanged: true });
  const commit = await putFile(env, path,
    text, `content: ${existing ? 'update' : 'add'} ${data.title}\n\nPublished from the Author's Desk.`, existing?.sha);
  await env.DB.prepare('INSERT INTO desk_publish_log (at, path, commit_sha, title) VALUES (?1, ?2, ?3, ?4)')
    .bind(Math.floor(Date.now() / 1000), path, commit.sha, data.title).run();
  return json({ ok: true, id, created: !existing, commit: commit.sha, commitUrl: commit.html_url, pageUrl: `/matches/${id}/` });
};
