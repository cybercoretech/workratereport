#!/usr/bin/env node
// Fetches wrestler facts (Wikidata, CC0) and freely licensed photos
// (Wikimedia Commons) for every file in src/content/wrestlers/.
//
//   node scripts/fetch-wrestler-data.mjs            # only wrestlers not fetched yet
//   node scripts/fetch-wrestler-data.mjs --all      # refresh everyone
//   node scripts/fetch-wrestler-data.mjs ric-flair  # just these slugs
//
// Writes src/data/wrestler-facts.json and public/wrestlers/<slug>.jpg (400px wide,
// metadata stripped, via ImageMagick when it's installed).
// Photos are kept ONLY when Commons reports a free license (CC0, public
// domain, CC BY, CC BY-SA); the credit and license are stored and shown
// on the site, as those licenses require.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const UA = 'workrate-report/0.1 (https://workrate-report.pages.dev; info@cybercoretech.net)';
const WRESTLER = 'Q13474373'; // occupation: professional wrestler
const DIR = 'src/content/wrestlers';
const OUT = 'src/data/wrestler-facts.json';
const IMG = 'public/wrestlers';
const THUMB = 480;

// Wikidata labels that differ from the site's display name.
const LOOKUP = {
  'the-rock': 'Dwayne Johnson', 'big-show': 'Paul Wight', 'batista': 'Dave Bautista', 'jbl': 'John Bradshaw Layfield',
  'sherri-martel': 'Sherri Martel', 'madusa': 'Madusa', 'sid': 'Sid Eudy', 'christian': 'Christian Cage',
  'mjf': 'Maxwell Jacob Friedman', 'britt-baker': 'Britt Baker', 'hangman-adam-page': 'Adam Page', 'mercedes-mone': 'Mercedes Moné',
  'iyo-sky': 'Iyo Sky', 'the-sandman': 'The Sandman', 'edge': 'Edge', 'kane': 'Kane', 'undertaker': 'The Undertaker',
  'ultimate-warrior': 'The Ultimate Warrior', 'iron-sheik': 'The Iron Sheik', 'road-warrior-hawk': 'Road Warrior Hawk',
  'road-warrior-animal': 'Road Warrior Animal', 'gunther': 'Gunther', 'big-e': 'Big E', 'lita': 'Lita', 'triple-h': 'Triple H',
  'bryan-danielson': 'Bryan Danielson', 'jon-moxley': 'Jon Moxley', 'steve-austin': 'Stone Cold Steve Austin',
  'ted-dibiase': 'Ted DiBiase', 'curt-hennig': 'Curt Hennig', 'rick-rude': 'Rick Rude', 'roddy-piper': 'Roddy Piper',
  'jake-roberts': 'Jake Roberts', 'jerry-lawler': 'Jerry Lawler', 'michael-hayes': 'Michael Hayes', 'steve-williams': 'Steve Williams',
  'randy-savage': 'Randy Savage', 'andre-the-giant': 'André the Giant', 'magnum-ta': 'Magnum T. A.', 'dusty-rhodes': 'Dusty Rhodes',
  'the-miz': 'The Miz', 'cm-punk': 'CM Punk', 'aj-styles': 'AJ Styles', 'zack-sabre-jr': 'Zack Sabre Jr.',
  'diamond-dallas-page': 'Diamond Dallas Page', 'raven': 'Raven',
};
// Records checked by hand whose occupation isn't tagged "professional wrestler" on Wikidata.
const PIN = { 'seth-rollins': 'Q715014', 'rey-mysterio': 'Q44152', 'steve-williams': 'Q1364352' };
// Second-chance searches by real name, for one-word ring names that search badly.
const REAL = {
  asuka: 'Kanako Urai', goldberg: 'Bill Goldberg', gunther: 'Walter Hahn', kane: 'Glenn Jacobs', lita: 'Amy Dumas',
  'robert-gibson': 'Robert Gibson wrestler', sabu: 'Terry Brunk', 'seth-rollins': 'Seth Rollins', taz: 'Peter Senerchia', vader: 'Leon White',
};
const FREE = /^(cc0|cc[- ]?zero|public domain|pd\b|pd-|cc by(-sa)?(\s|-)?\d|cc-by(-sa)?-\d|cc by(-sa)?$|attribution)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, params) {
  const u = new URL(url);
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let tries = 0; tries < 4; tries++) {
    const res = await fetch(u, { headers: { 'user-agent': UA, accept: 'application/json' } });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (tries + 1)); continue; }
    if (!res.ok) throw new Error(`${u.host} ${res.status}`);
    return res.json();
  }
  throw new Error(`${u.host}: gave up`);
}
const wd = (params) => get('https://www.wikidata.org/w/api.php', { format: 'json', origin: '*', ...params });
const commons = (params) => get('https://commons.wikimedia.org/w/api.php', { format: 'json', origin: '*', ...params });
const claim = (e, p) => e.claims?.[p]?.[0]?.mainsnak?.datavalue?.value;
const year = (t) => (t?.time ? t.time.slice(1, 5) : null);
const date = (t) => (t?.time ? t.time.slice(1, 11).replace(/-00/g, '') : null);
const strip = (html) => String(html ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

function frontName(slug) {
  const text = readFileSync(`${DIR}/${slug}.md`, 'utf8');
  const m = text.match(/^name:\s*"((?:[^"\\]|\\.)*)"/m);
  return m ? JSON.parse(`"${m[1]}"`) : slug;
}
// '"Rowdy" Roddy Piper' -> 'Roddy Piper'
const plain = (name) => name.replace(/"[^"]*"\s*/g, '').replace(/^The\s+/, '').trim();

async function findEntity(slug, name) {
  if (PIN[slug]) return (await wd({ action: 'wbgetentities', ids: PIN[slug], props: 'claims|labels', languages: 'en' })).entities[PIN[slug]];
  const tries = [...new Set([LOOKUP[slug], name.replace(/"/g, ''), plain(name), `The ${plain(name)}`, REAL[slug]].filter(Boolean))];
  for (const q of tries) {
    const r = await wd({ action: 'wbsearchentities', search: q, language: 'en', type: 'item', limit: '20' });
    const ids = (r.search || []).map((s) => s.id);
    if (!ids.length) continue;
    const ents = (await wd({ action: 'wbgetentities', ids: ids.slice(0, 50).join('|'), props: 'claims|labels', languages: 'en' })).entities;
    // Keep search order; take the first that is actually a professional wrestler.
    const hit = ids.map((id) => ents[id]).find((e) => (e?.claims?.P106 || []).some((c) => c.mainsnak?.datavalue?.value?.id === WRESTLER));
    if (hit) return hit;
  }
  return null;
}

async function label(id) {
  if (!id) return null;
  const e = (await wd({ action: 'wbgetentities', ids: id, props: 'labels', languages: 'en' })).entities[id];
  return e?.labels?.en?.value ?? null;
}

async function photo(slug, file) {
  if (!file) return null;
  const r = await commons({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: String(THUMB) });
  const info = Object.values(r.query.pages)[0]?.imageinfo?.[0];
  if (!info) return null;
  const meta = info.extmetadata || {};
  const license = strip(meta.LicenseShortName?.value);
  if (!FREE.test(license) || /fair use|non-free/i.test(license)) return { rejected: license || 'unknown license' };
  const res = await fetch(info.thumburl, { headers: { 'user-agent': UA } });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(`${IMG}/${slug}.jpg`, buf);
  // Shrink for the web and strip metadata (camera EXIF can include GPS). Needs ImageMagick.
  const shrunk = spawnSync('magick', [`${IMG}/${slug}.jpg`, '-auto-orient', '-resize', '400x>', '-strip', '-sampling-factor', '4:2:0', '-quality', '80', '-interlace', 'JPEG', `${IMG}/${slug}.jpg`]);
  if (shrunk.status !== 0) console.warn(`  (ImageMagick not available; ${slug}.jpg kept full size with metadata)`);
  const dims = spawnSync('magick', ['identify', '-format', '%w %h', `${IMG}/${slug}.jpg`], { encoding: 'utf8' }).stdout?.split(' ').map(Number);
  return {
    src: `/wrestlers/${slug}.jpg`,
    width: dims?.[0] || info.thumbwidth, height: dims?.[1] || info.thumbheight,
    credit: strip(meta.Artist?.value) || 'Unknown author',
    license, license_url: meta.LicenseUrl?.value ?? null,
    source: info.descriptionurl,
  };
}

const args = process.argv.slice(2);
mkdirSync(IMG, { recursive: true });
mkdirSync('src/data', { recursive: true });
const facts = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const slugs = readdirSync(DIR).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3)).sort()
  .filter((s) => (args.includes('--all') ? true : args.filter((a) => !a.startsWith('--')).length ? args.includes(s) : !facts[s]?.qid));

const report = { found: 0, photos: 0, rejected: [], missing: [] };
for (const slug of slugs) {
  const name = frontName(slug);
  try {
    const e = await findEntity(slug, name);
    if (!e) { report.missing.push(slug); facts[slug] = { qid: null }; continue; }
    const pic = await photo(slug, claim(e, 'P18'));
    if (pic?.rejected) report.rejected.push(`${slug} (${pic.rejected})`);
    const heightClaim = claim(e, 'P2048');
    facts[slug] = {
      qid: e.id,
      wikidata_label: e.labels?.en?.value ?? null,
      birth_name: claim(e, 'P1477')?.text ?? null,
      born: date(claim(e, 'P569')),
      died: date(claim(e, 'P570')),
      birthplace: await label(claim(e, 'P19')?.id),
      height_cm: heightClaim && /Q11573|Q174728/.test(heightClaim.unit) ? Math.round(Number(heightClaim.amount) * (/Q11573/.test(heightClaim.unit) ? 100 : 1)) : null,
      debut: year(claim(e, 'P2031')),
      photo: pic && !pic.rejected ? pic : null,
    };
    report.found++;
    if (facts[slug].photo) report.photos++;
    process.stdout.write(`${facts[slug].photo ? '📷' : '  '} ${slug} → ${e.id} ${e.labels?.en?.value ?? ''}\n`);
  } catch (err) {
    report.missing.push(`${slug} (${err.message})`);
  }
  await sleep(250);
}
writeFileSync(OUT, JSON.stringify(Object.fromEntries(Object.entries(facts).sort()), null, 2) + '\n');
console.log(`\nfound ${report.found}/${slugs.length}, photos ${report.photos}`);
if (report.rejected.length) console.log('photos skipped (not free):', report.rejected.join(', '));
if (report.missing.length) console.log('not found on Wikidata:', report.missing.join(', '));
