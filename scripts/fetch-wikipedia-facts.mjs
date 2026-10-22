#!/usr/bin/env node
// Pulls structured facts from each wrestler's English Wikipedia infobox:
// birth name, ring names (previous names and gimmicks), trainers, debut,
// retirement. These are facts, not prose. Nothing from article text is
// copied into the site; bios are written separately, with a source link.
//
//   node scripts/fetch-wikipedia-facts.mjs [--leads <dir>] [slug ...]
//
// Merges into src/data/wrestler-facts.json (adds wikipedia, ring_names,
// trained_by, birth_name_wp, debut_wp, retired_wp). With --leads, also saves
// each article's lead section as plain text in <dir> for the bio writer's
// reference; keep that folder out of the repo.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const UA = 'workrate-report/0.1 (https://workrate-report.pages.dev; info@cybercoretech.net)';
const FACTS = 'src/data/wrestler-facts.json';
const args = process.argv.slice(2);
const leadsAt = args.indexOf('--leads');
const LEADS = leadsAt >= 0 ? args[leadsAt + 1] : null;
const only = args.filter((a, i) => !a.startsWith('--') && i !== leadsAt + 1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(host, params) {
  const u = new URL(`https://${host}/w/api.php`);
  Object.entries({ format: 'json', formatversion: '2', ...params }).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let i = 0; i < 4; i++) {
    const res = await fetch(u, { headers: { 'user-agent': UA } });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${host} ${res.status}`);
    return res.json();
  }
  throw new Error('gave up');
}

// Pull one infobox field's raw value (handles nested templates and links).
function field(wikitext, names) {
  for (const name of names) {
    const m = wikitext.match(new RegExp(`\\n\\s*\\|\\s*${name}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[a-z_ ]+\\s*=|\\n\\}\\})`, 'i'));
    if (m && m[1].trim()) return m[1].trim();
  }
  return null;
}
// Wikitext → plain list items.
function clean(v) {
  if (!v) return [];
  let s = v
    .replace(/<ref[^>]*\/>/gi, '').replace(/<ref[\s\S]*?<\/ref>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{\{\s*(?:nowrap|nobr)\s*\|([^{}]*)\}\}/gi, '$1')
    .replace(/\{\{\s*(?:plainlist|ubl|unbulleted list|flatlist|hlist)\s*\|?/gi, '')
    .replace(/\{\{\s*(?:efn|sfn|citation needed|cn|refn)[^{}]*\}\}/gi, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\}\}/g, '').replace(/\{\{[^{}|]*\|/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/date\s*=\s*[A-Za-z]+ \d{4}/g, '')
    .replace(/[”“]/g, '"');
  return s.split(/\n|\|/).map((x) => x.replace(/^[*\s]+/, '').replace(/\s+/g, ' ').trim()).filter((x) => x && x.length < 80 && !/^(class|style)\s*=/.test(x));
}
const year = (v) => (v?.match(/\b(19|20)\d{2}\b/) || [null])[0];

const facts = JSON.parse(readFileSync(FACTS, 'utf8'));
if (LEADS) mkdirSync(LEADS, { recursive: true });
const slugs = Object.keys(facts).filter((s) => facts[s].qid && (!only.length || only.includes(s)));
let n = 0;
for (let i = 0; i < slugs.length; i += 40) {
  const batch = slugs.slice(i, i + 40);
  const ents = (await get('www.wikidata.org', { action: 'wbgetentities', ids: batch.map((s) => facts[s].qid).join('|'), props: 'sitelinks', sitefilter: 'enwiki' })).entities;
  for (const slug of batch) {
    const title = ents[facts[slug].qid]?.sitelinks?.enwiki?.title;
    if (!title) { console.log(`   ${slug}: no English Wikipedia article`); continue; }
    const page = await get('en.wikipedia.org', { action: 'parse', page: title, prop: 'wikitext', section: '0', redirects: '1' });
    const wt = page.parse?.wikitext ?? '';
    const ring = clean(field(wt, ['names', 'ring_names?', 'ringname']));
    Object.assign(facts[slug], {
      wikipedia: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
      wikipedia_title: title,
      birth_name_wp: clean(field(wt, ['birth_name', 'birthname', 'real_name']))[0] ?? null,
      ring_names: ring,
      trained_by: clean(field(wt, ['trainer', 'trained_by'])).slice(0, 8),
      debut_wp: year(field(wt, ['debut'])),
      retired_wp: year(field(wt, ['retired'])),
    });
    // The lead's first words are the legal name ("Richard Morgan Fliehr (born ...), known as Ric Flair").
    const ex = await get('en.wikipedia.org', { action: 'query', prop: 'extracts', exintro: '1', explaintext: '1', titles: title, redirects: '1' });
    const text = ex.query?.pages?.[0]?.extract ?? '';
    const legal = text.match(/^([^(\n]{3,80}?)\s*\(/)?.[1]?.trim() ?? null;
    facts[slug].legal_name_wp = legal && !/^(The|A|An)\s/.test(legal) ? legal : null;
    if (LEADS) writeFileSync(`${LEADS}/${slug}.txt`, `${title}\n\n${text}`);
    n++;
    process.stdout.write(`✓ ${slug.padEnd(24)} ${ring.length} ring names${facts[slug].birth_name_wp ? ` · born ${facts[slug].birth_name_wp}` : ''}\n`);
    await sleep(150);
  }
}
writeFileSync(FACTS, JSON.stringify(Object.fromEntries(Object.entries(facts).sort()), null, 2) + '\n');
console.log(`\nupdated ${n}/${slugs.length}`);
