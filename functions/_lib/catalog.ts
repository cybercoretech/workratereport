import type { Env } from './env';
import type { Catalog } from './content';
import { getFile } from './github';

/** Valid ids from the deployed site, plus anything published since that build. */
export async function loadCatalog(env: Env, request: Request): Promise<Catalog & { check: (kind: 'wrestlers', id: string) => Promise<boolean> }> {
  const res = await env.ASSETS.fetch(new URL('/data/catalog.json', request.url));
  const c = (await res.json()) as { wrestlers: { id: string }[]; promotions: { id: string }[]; dna: { id: string }[] };
  const cat = { wrestlers: c.wrestlers.map((w) => w.id), promotions: c.promotions.map((p) => p.id), dna: c.dna.map((d) => d.id) };
  return {
    ...cat,
    // A wrestler added from the desk a minute ago isn't in the deployed catalog yet.
    check: async (_kind, id) => cat.wrestlers.includes(id) || Boolean(await getFile(env, `src/content/wrestlers/${id}.md`)),
  };
}
