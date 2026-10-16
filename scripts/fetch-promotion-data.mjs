#!/usr/bin/env node
// Fetches promotion facts from Wikidata (CC0) and freely licensed logos
// from Wikimedia Commons for every promotion in PROMOS below.
//   node scripts/fetch-promotion-data.mjs
// Writes src/data/promotion-facts.json and public/promotions/<slug>.png.
// Logos are kept ONLY when Commons reports a free license (usually
// public-domain text logos). Everything else gets the site's own badge.
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const UA = 'workrate-report/0.1 (https://workrate-report.pages.dev; info@cybercoretech.net)';
const OUT = 'src/data/promotion-facts.json';
const IMG = 'public/promotions';
// Site slug → Wikidata item, checked by hand (search results include TV
// shows, titles and video games with the same names).
const PROMOS = {
  wwe: 'Q35339', wwf: 'Q35339', aew: 'Q60324825', njpw: 'Q1150494', tna: 'Q131728', roh: 'Q588459', nxt: 'Q35903',
  mlw: 'Q1488298', gcw: 'Q85762606', hog: 'Q25000598', 'west-coast-pro': 'Q138004957', pwg: 'Q592276', revpro: 'Q21006854',
  progress: 'Q7248581', czw: 'Q1113590', cmll: 'Q1207955', nwa: 'Q1068680', evolve: 'Q4921457',
  'jcp-nwa': 'Q1931754', wcw: 'Q130171', ecw: 'Q73002', 'mid-south': 'Q4520528', memphis: 'Q1128866', awa: 'Q467330', 'world-class': 'Q1817448',
};
// Logos on Wikidata that are out of date (TNA's is still the Impact Wrestling mark).
const SKIP_LOGO = new Set(['wwf', 'tna']);
const FREE = /^(cc0|public domain|pd\b|pd-|cc by(-sa)?(\s|-)?\d|cc-by(-sa)?-\d|cc by(-sa)?$|attribution)/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, params) {
  const u = new URL(url); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  for (let i = 0; i < 4; i++) {
    const res = await fetch(u, { headers: { 'user-agent': UA } });
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${u.host} ${res.status}`);
    return res.json();
  }
  throw new Error('gave up');
}
const wd = (p) => get('https://www.wikidata.org/w/api.php', { format: 'json', ...p });
const values = (e, p) => (e.claims?.[p] || []).filter((c) => c.rank !== 'deprecated').map((c) => c.mainsnak?.datavalue?.value).filter(Boolean);
const date = (t) => (t?.time ? t.time.slice(1, 11).replace(/-00/g, '') : null);
const strip = (h) => String(h ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
async function labels(ids) {
  if (!ids.length) return [];
  const e = (await wd({ action: 'wbgetentities', ids: ids.join('|'), props: 'labels', languages: 'en' })).entities;
  return ids.map((id) => e[id]?.labels?.en?.value).filter(Boolean);
}
async function logo(slug, file) {
  if (!file) return null;
  const r = await get('https://commons.wikimedia.org/w/api.php', { format: 'json', action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '400' });
  const info = Object.values(r.query.pages)[0]?.imageinfo?.[0];
  if (!info) return null;
  const license = strip(info.extmetadata?.LicenseShortName?.value);
  if (!FREE.test(license) || /fair use|non-free/i.test(license)) return { rejected: license || 'unknown' };
  const res = await fetch(info.thumburl, { headers: { 'user-agent': UA } }); // PNG render, even for SVG originals
  if (!res.ok) return null;
  writeFileSync(`${IMG}/${slug}.png`, Buffer.from(await res.arrayBuffer()));
  spawnSync('magick', [`${IMG}/${slug}.png`, '-strip', '-resize', '400x200>', `${IMG}/${slug}.png`]);
  const dims = spawnSync('magick', ['identify', '-format', '%w %h', `${IMG}/${slug}.png`], { encoding: 'utf8' }).stdout?.split(' ').map(Number);
  return { src: `/promotions/${slug}.png`, width: dims?.[0] || 400, height: dims?.[1] || 200, credit: strip(info.extmetadata?.Artist?.value) || 'See source', license, license_url: info.extmetadata?.LicenseUrl?.value ?? null, source: info.descriptionurl };
}

mkdirSync(IMG, { recursive: true }); mkdirSync('src/data', { recursive: true });
const out = {};
const cache = {};
for (const [slug, qid] of Object.entries(PROMOS)) {
  const e = cache[qid] ??= (await wd({ action: 'wbgetentities', ids: qid, props: 'claims|labels', languages: 'en' })).entities[qid];
  const [founders, owners, hq, country] = await Promise.all([
    labels(values(e, 'P112').map((v) => v.id)), labels(values(e, 'P127').map((v) => v.id)),
    labels(values(e, 'P159').map((v) => v.id).slice(0, 1)), labels(values(e, 'P17').map((v) => v.id).slice(0, 1)),
  ]);
  // WWF: WWE's current mark isn't the WWF's. TNA: Wikidata still has the Impact logo.
  const lg = SKIP_LOGO.has(slug) ? null : await logo(slug, values(e, 'P154')[0]);
  out[slug] = {
    qid, label: e.labels?.en?.value ?? null,
    founded: date(values(e, 'P571')[0]), dissolved: date(values(e, 'P576')[0]),
    founders, owners, headquarters: hq[0] ?? null, country: country[0] ?? null,
    website: values(e, 'P856')[0] ?? null,
    logo: lg && !lg.rejected ? lg : null, logo_rejected: lg?.rejected ?? null,
  };
  console.log(`${out[slug].logo ? '🖼 ' : '  '} ${slug.padEnd(15)} ${out[slug].label} | founded ${out[slug].founded} | web ${out[slug].website ?? '-'}${lg?.rejected ? ` | logo not free (${lg.rejected})` : ''}`);
  await sleep(250);
}
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
