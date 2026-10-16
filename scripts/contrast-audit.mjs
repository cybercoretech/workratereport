#!/usr/bin/env node
// Audits every theme the picker offers (Cybercore registry palettes plus
// the site mashups) against WCAG contrast targets, before and after the
// guard in public/js/contrast.js.  Usage: node scripts/contrast-audit.mjs
import { readFileSync } from 'node:fs';

const load = (file) => { const module = { exports: {} }; new Function('module', readFileSync(file, 'utf8'))(module); return module.exports; };
const { guard, report } = load('public/js/contrast.js');
const DATA = 'https://cybercore-tech.github.io/data';
const themeSrc = readFileSync('public/js/theme.js', 'utf8');
const MASHUPS = [...themeSrc.matchAll(/\{ id: '([\w-]+)', label: '([^']+)', base: '([\w-]+)', accent: '([\w-]+)' \}/g)].map((m) => ({ id: m[1], label: m[2], base: m[3], accent: m[4] }));
const BUILTIN = JSON.parse(themeSrc.match(/'ten-pounds-of-gold': (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
const SURFACE = ['bg', 'white', 'panel', 'line', 'muted'];

const grid = await (await fetch(`${DATA}/cybergrid.json`)).json();
const families = grid.families || grid;
const fam = (n) => Object.keys(families).find((f) => families[f].includes(n));
const cache = {};
const pal = async (n) => (cache[n] ??= await (await fetch(`${DATA}/themes/${fam(n)}/${n}.json`)).json());

const themes = [{ id: 'ten-pounds-of-gold', p: BUILTIN }];
for (const m of MASHUPS) { const [b, a] = await Promise.all([pal(m.base), pal(m.accent)]); const p = { ...a }; SURFACE.forEach((k) => { p[k] = b[k]; }); themes.push({ id: m.id, p }); }
for (const n of Object.values(families).flat()) themes.push({ id: n, p: await pal(n) });

let failsBefore = 0, failsAfter = 0, themesFixed = 0;
const worst = [];
for (const t of themes) {
  const before = report(t.p).filter((r) => r.ratio < r.target);
  const after = report(guard(t.p).palette).filter((r) => r.ratio < r.target);
  failsBefore += before.length; failsAfter += after.length;
  if (before.length) { themesFixed++; worst.push({ id: t.id, n: before.length, pairs: before.map((r) => `${r.fg}/${r.bg} ${r.ratio.toFixed(2)}`).join(', ') }); }
}
console.log(`Themes audited: ${themes.length} (${MASHUPS.length + 1} site, ${themes.length - MASHUPS.length - 1} registry)`);
console.log(`Failing colour pairs before the guard: ${failsBefore} across ${themesFixed} themes`);
console.log(`Failing colour pairs after the guard:  ${failsAfter}`);
console.log('\nMost-affected themes before the guard:');
worst.sort((a, b) => b.n - a.n).slice(0, 12).forEach((w) => console.log(`  ${w.id.padEnd(28)} ${w.pairs}`));
process.exit(failsAfter ? 1 : 0);
