// Everything the Author's Desk needs to fill its forms. All of it is
// already public on the site; review bodies are included so the desk can
// open an existing match for editing.
import { getCollection } from 'astro:content';

export async function GET() {
  const [matches, wrestlers, promotions, dna, columns] = await Promise.all([
    getCollection('matches'), getCollection('wrestlers'), getCollection('promotions'), getCollection('dna'), getCollection('columns'),
  ]);
  const body = {
    built: new Date().toISOString(),
    promotions: promotions.sort((a, b) => a.data.order - b.data.order)
      .map((p) => ({ id: p.id, name: p.data.name, short: p.data.short, group: p.data.group })),
    wrestlers: wrestlers.sort((a, b) => a.data.name.localeCompare(b.data.name))
      .map((w) => ({ id: w.id, name: w.data.name, eras: w.data.eras })),
    dna: dna.map((d) => ({ id: d.id, title: d.data.title })),
    matches: matches.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).map((m) => ({
      id: m.id,
      data: {
        ...m.data,
        date: m.data.date.toISOString().slice(0, 10),
        promotion: m.data.promotion.id,
        wrestlers: m.data.wrestlers.map((w) => w.id),
        dna: m.data.dna.map((d) => d.id),
      },
      body: (m.body ?? '').replace(/<!--[\s\S]*?-->/g, '').trim(),
    })),
    columns: columns.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).map((c) => ({
      id: c.id,
      data: { ...c.data, date: c.data.date.toISOString().slice(0, 10), matches: c.data.matches.map((m) => m.id), wrestlers: c.data.wrestlers.map((w) => w.id) },
      body: (c.body ?? '').trim(),
    })),
  };
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
