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
    order: z.number().default(50),
    summary: z.string(),
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

export const collections = { matches, wrestlers, promotions, factions, dna };
