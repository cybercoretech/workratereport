import { getCollection, type CollectionEntry } from 'astro:content';
import { value } from './ratings';

export type Match = CollectionEntry<'matches'>;

export const CONTACT = 'info@cybercoretech.net';

/** Primary sections: drives the header, drawer and footer (BLUEPRINT §2). */
export const SECTIONS = [
  { href: '/matches/', label: 'Matches', sub: [
    ['/matches/all/', 'All matches'], ['/matches/top-rated/', 'Top rated'],
    ['/matches/modern/', 'Modern era'], ['/matches/classic/', 'Classic era'],
    ['/matches/promotion/', 'By promotion'], ['/matches/year/', 'By year'] ] },
  { href: '/wrestlers/', label: 'Wrestlers', sub: [
    ['/wrestlers/all/', 'A–Z'], ['/wrestlers/modern/', 'Modern roster'],
    ['/wrestlers/legends/', 'Legends'], ['/wrestlers/factions/', 'Factions'] ] },
  { href: '/vault/', label: 'Classic Vault', sub: [
    ['/vault/jcp-nwa/', 'JCP / NWA'], ['/vault/wcw/', 'WCW'], ['/vault/wwf/', 'WWF'], ['/vault/ecw/', 'ECW'],
    ['/vault/territories/', 'Territories'], ['/vault/events/', 'Events'], ['/vault/feuds/', 'Feuds'] ] },
  { href: '/dna/', label: 'Territory DNA', sub: [] },
  { href: '/me-vs-meltzer/', label: 'Me vs. Meltzer', sub: [] },
  { href: '/watch/', label: 'Watch', sub: [['/watch/starter-paths/', 'Starter paths'], ['/watch/then-and-now/', 'Then & Now'], ['/watch/services/', 'Where to watch']] },
  // Drawer and footer only (the inline header nav has no room for these).
  { href: '/lists/', label: 'Lists', sub: [], inline: false },
  { href: '/columns/', label: 'Columns', sub: [['/columns/i-was-there/', 'I Was There'], ['/columns/analysis/', 'Analysis']], inline: false },
] as const;

export const byDateDesc = (a: Match, b: Match) => b.data.date.valueOf() - a.data.date.valueOf();
export const byRatingDesc = (a: Match, b: Match) =>
  value(b.data.my_rating) - value(a.data.my_rating) ||
  value(b.data.meltzer_rating) - value(a.data.meltzer_rating) ||
  byDateDesc(a, b);

export async function matches() {
  return (await getCollection('matches')).sort(byDateDesc);
}

export const year = (m: Match) => m.data.date.getUTCFullYear();

export const fmtDate = (d: Date) =>
  d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

/** Pick featured first, then fill by a sort; never repeats. */
export function pick(list: Match[], n: number, sort = byDateDesc) {
  const featured = list.filter((m) => m.data.featured);
  const rest = list.filter((m) => !m.data.featured).sort(sort);
  return [...featured.sort(sort), ...rest].slice(0, n);
}
