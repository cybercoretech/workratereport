// Lists the site builds on its own from the ratings. They fill in as
// reviews are published; author-written lists live in src/content/lists.
import { matches, byRatingDesc, year, type Match } from './site';
import { value, isFiveStar } from './ratings';

export interface AutoList { id: string; title: string; summary: string; items: { match: Match; note?: string }[] }

const best = (m: Match) => Math.max(value(m.data.my_rating), value(m.data.meltzer_rating));

export async function autoLists(): Promise<AutoList[]> {
  const all = await matches();
  const rated = all.filter((m) => best(m) > -Infinity);
  const top = (list: Match[], n: number) => [...list].sort(byRatingDesc).slice(0, n).map((match) => ({ match }));
  const years = [...new Set(rated.map(year))].sort((a, b) => b - a);
  return [
    { id: 'five-star-matches', title: 'Every five-star match', summary: 'Every match on the site rated five stars or more, by us or by Dave Meltzer.',
      items: top(all.filter((m) => isFiveStar(m.data.my_rating) || isFiveStar(m.data.meltzer_rating)), 500) },
    { id: 'best-of-each-year', title: 'Best match of every year', summary: 'The top-rated match from each year on the site.',
      items: years.map((y) => ({ match: [...rated.filter((m) => year(m) === y)].sort(byRatingDesc)[0], note: String(y) })) },
    { id: 'vault-top-ten', title: 'Classic Vault top ten', summary: 'The ten best classic-era matches on the site.', items: top(rated.filter((m) => m.data.era === 'classic'), 10) },
    { id: 'modern-top-ten', title: 'Modern era top ten', summary: 'The ten best modern-era matches on the site.', items: top(rated.filter((m) => m.data.era === 'modern'), 10) },
  ];
}
