import { fail, json, type Env } from '../../_lib/env';
import { slugify, wrestlerFile } from '../../_lib/content';
import { loadCatalog } from '../../_lib/catalog';
import { GitHubError, getFile, putFile } from '../../_lib/github';

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try { return await handle(ctx); } catch (e) {
    if (e instanceof GitHubError) { console.error('desk/wrestler publish:', e.message); return fail(502, e.message); }
    throw e;
  }
};

const handle: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DESK_GITHUB_TOKEN) return fail(503, 'Publishing is not configured yet (missing DESK_GITHUB_TOKEN).');
  let raw: { name?: unknown; eras?: unknown; promotions?: unknown };
  try { raw = await request.json(); } catch { return fail(400, 'Bad JSON'); }
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 120) : '';
  const id = slugify(name);
  if (!name || !id) return fail(422, 'Name is required');
  const cat = await loadCatalog(env, request);
  const eras = (Array.isArray(raw.eras) ? raw.eras : []).filter((e): e is string => e === 'modern' || e === 'classic');
  const promotions = (Array.isArray(raw.promotions) ? raw.promotions : []).map(String).filter((p) => cat.promotions.includes(p));
  const path = `src/content/wrestlers/${id}.md`;
  if (cat.wrestlers.includes(id) || (await getFile(env, path))) return json({ ok: true, id, existed: true });
  const commit = await putFile(env, path, wrestlerFile(name, eras, promotions), `content: add wrestler ${name}\n\nPublished from the Author's Desk.`);
  await env.DB.prepare('INSERT INTO desk_publish_log (at, path, commit_sha, title) VALUES (?1, ?2, ?3, ?4)')
    .bind(Math.floor(Date.now() / 1000), path, commit.sha, `Wrestler: ${name}`).run();
  return json({ ok: true, id, created: true, commit: commit.sha });
};
