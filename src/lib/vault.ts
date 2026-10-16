import type { CollectionEntry } from 'astro:content';
import type { Match } from './site';

/** Matches whose event name starts with one of the series' prefixes. */
export const editionsOf = (e: CollectionEntry<'events'>, all: Match[]) =>
  all.filter((m) => e.data.match_events.some((p) => m.data.event.toLowerCase().startsWith(p.toLowerCase())));

/** Matches tagged feud-<id>, or with both sides in the match. */
export const feudMatches = (f: CollectionEntry<'feuds'>, all: Match[]) => {
  const [a, b] = f.data.sides.map((s) => s.id);
  return all.filter((m) => m.data.tags.includes(`feud-${f.id}`) || (m.data.wrestlers.some((w) => w.id === a) && m.data.wrestlers.some((w) => w.id === b)));
};
