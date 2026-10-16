import { fail, json, type Env } from '../../_lib/env';
import { columnFile, columnSlug, validateColumn } from '../../_lib/content';
import { loadCatalog } from '../../_lib/catalog';
import { getFile, putFile } from '../../_lib/github';

interface Body { id?: string; data?: Record<string, unknown>; body?: string; create?: boolean }

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.DESK_GITHUB_TOKEN) return fail(503, 'Publishing is not configured yet (missing DESK_GITHUB_TOKEN).');
  let input: Body;
  try { input = (await request.json()) as Body; } catch { return fail(400, 'Bad JSON'); }
  const text = typeof input.body === 'string' ? input.body : '';
  if (!text.trim()) return fail(422, 'Please fix these first', { errors: ['The column needs some text'] });
  if (text.length > 100_000) return fail(400, 'Column is too long (100,000 characters max)');
  const cat = await loadCatalog(env, request);
  const { data, errors } = validateColumn(input.data ?? {}, cat);
  if (errors.length) return fail(422, 'Please fix these first', { errors });
  const id = input.id && /^[a-z0-9-]{3,100}$/.test(input.id) ? input.id : columnSlug(data);
  if (['i-was-there', 'analysis'].includes(id)) return fail(422, 'That title would clash with a section page; add a word to it.');
  const path = `src/content/columns/${id}.md`;
  const existing = await getFile(env, path);
  if (input.create && existing) return fail(409, `A column "${id}" already exists. Open it from the list to edit it.`);
  const file = columnFile(data, text);
  if (existing && existing.text === file) return json({ ok: true, id, unchanged: true });
  const commit = await putFile(env, path, file, `content: ${existing ? 'update' : 'add'} column "${data.title}"\n\nPublished from the Author's Desk.`, existing?.sha);
  await env.DB.prepare('INSERT INTO desk_publish_log (at, path, commit_sha, title) VALUES (?1, ?2, ?3, ?4)')
    .bind(Math.floor(Date.now() / 1000), path, commit.sha, `Column: ${data.title}`).run();
  return json({ ok: true, id, created: !existing, commit: commit.sha, commitUrl: commit.html_url, pageUrl: `/columns/${id}/` });
};
