import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Our ratings: precise to 0.01 (4.89, 4.97), 5 is the hard cap (BLUEPRINT §5).
// "dud" and negatives are allowed. null = not rated yet.
const quarter = (n: number) => Math.round(n * 4) === n * 4;
const hundredth = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
const myRating = z
  .union([z.number().min(-5).max(5).refine(hundredth, 'use at most two decimals (like 4.89)'), z.literal('dud')])
  .nullable();
// Meltzer's scale: quarter stars, no cap (Omega/Okada went to 7).
const meltzerRating = z
  .union([z.number().min(-5).max(10).refine(quarter, 'use quarter steps'), z.literal('dud')])
  .nullable()
  .default(null);

const matches = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/matches' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    promotion: reference('promotions'),
    event: z.string(),
    venue: z.string().optional(),
    wrestlers: z.array(reference('wrestlers')).min(1),
    era: z.enum(['modern', 'classic']),
    type: z.string().default('singles'),
    title_match: z.string().optional(),
    duration: z.string().optional(),
    result: z.string().optional(),
    my_rating: myRating,
    meltzer_rating: meltzerRating,
    youtube: z.string().regex(/^[\w-]{11}$/).nullable().default(null),
    where_to_watch: z.array(z.string()).default([]),
    dna: z.array(reference('dna')).default([]),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    summary: z.string().optional(),
    // Facts still to confirm before launch (BLUEPRINT §6).
    verify: z.array(z.string()).default([]),
  }),
});

const wrestlers = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/wrestlers' }),
  schema: z.object({
    name: z.string(),
    active: z.string().optional(),
    promotions: z.array(reference('promotions')).default([]),
    eras: z.array(z.enum(['modern', 'classic'])).default([]),
    factions: z.array(reference('factions')).default([]),
    featured: z.boolean().default(false),
    summary: z.string().optional(),
  }),
});

const promotions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/promotions' }),
  schema: z.object({
    name: z.string(),
    short: z.string(),
    years: z.string(),
    vault: z.boolean().default(false),
    group: z.enum(['modern', 'vault', 'territory']).default('modern'),
    // Promotions page section: the majors, or the independents.
    tier: z.enum(['major', 'independent']).default('major'),
    order: z.number().default(50),
    summary: z.string(),
    // Company facts, checked by hand (Wikidata facts in src/data are the fallback).
    founded: z.string().optional(),
    founders: z.array(z.string()).default([]),
    owner: z.string().optional(),
    based: z.string().optional(),
    website: z.string().url().optional(),
    standouts: z.array(z.string()).default([]),
  }),
});

const factions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/factions' }),
  schema: z.object({
    name: z.string(),
    years: z.string(),
    promotions: z.array(reference('promotions')).default([]),
    summary: z.string(),
  }),
});

const dna = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dna' }),
  schema: z.object({
    title: z.string(),
    modern: reference('wrestlers'),
    classic: reference('wrestlers'),
    flagship: z.boolean().default(false),
    summary: z.string(),
    traits: z.array(z.object({ trait: z.string(), modern: z.string(), classic: z.string() })).default([]),
    draft: z.boolean().default(true),
  }),
});

// Ranked lists written by the author. Automatic lists (every five-star match,
// best of each year...) are built in src/lib/lists.ts from the ratings.
const lists = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/lists' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    items: z.array(z.object({ match: reference('matches'), note: z.string().optional() })).min(1),
    featured: z.boolean().default(false),
  }),
});

const columns = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/columns' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    series: z.enum(['i-was-there', 'analysis']),
    summary: z.string(),
    matches: z.array(reference('matches')).default([]),
    wrestlers: z.array(reference('wrestlers')).default([]),
    featured: z.boolean().default(false),
  }),
});

// Starter paths: an ordered watch list for newcomers.
const paths = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paths' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    steps: z.array(z.object({ match: reference('matches'), why: z.string().optional() })).min(1),
    featured: z.boolean().default(false),
  }),
});

// Event series (Starrcade, WrestleMania...). Editions are matched from each
// match's `event` text, so no per-match tagging is needed.
const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/events' }),
  schema: z.object({
    name: z.string(),
    promotions: z.array(reference('promotions')).min(1),
    years: z.string(),
    match_events: z.array(z.string()).min(1),   // event-name prefixes, e.g. ["Starrcade"]
    summary: z.string(),
  }),
});

// Feuds: matches are found by tag `feud-<id>` or by both wrestlers appearing.
const feuds = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/feuds' }),
  schema: z.object({
    name: z.string(),
    sides: z.array(reference('wrestlers')).length(2),
    years: z.string(),
    summary: z.string(),
  }),
});

export const collections = { matches, wrestlers, promotions, factions, dna, lists, columns, paths, events, feuds };
