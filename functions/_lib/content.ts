// Validates desk input and writes match/wrestler Markdown files.
// Mirrors src/content.config.ts so a published file always passes the build.
export type Rating = number | 'dud' | null;

export interface MatchInput {
  title: string; date: string; promotion: string; event: string; venue?: string;
  wrestlers: string[]; era: 'modern' | 'classic'; type: string;
  title_match?: string; duration?: string; result?: string;
  my_rating: Rating; meltzer_rating: Rating; youtube: string | null;
  where_to_watch: string[]; dna: string[]; tags: string[]; featured: boolean;
  summary?: string; verify: string[];
}

export interface Catalog { wrestlers: string[]; promotions: string[]; dna: string[]; matches?: string[] }

export const slugify = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/["'’.]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const quarter = (n: number) => Math.round(n * 4) === n * 4;
const hundredth = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
const str = (v: unknown, max = 300) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, max = 40) => (Array.isArray(v) ? v.map((x) => str(x, 200)).filter(Boolean).slice(0, max) : []);

function rating(v: unknown, cap: number, field: string, errors: string[], precise = false): Rating {
  if (v === null || v === undefined || v === '') return null;
  if (v === 'dud') return 'dud';
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) { errors.push(`${field}: not a number`); return null; }
  if (precise ? !hundredth(n) : !quarter(n)) errors.push(precise ? `${field}: use at most two decimals (like 4.89)` : `${field}: use quarter-star steps (like 4.25 or 4.75)`);
  if (n > cap) errors.push(`${field}: ${cap} is the most allowed`);
  if (n < -5) errors.push(`${field}: -5 is the lowest allowed`);
  return precise ? Math.round(n * 100) / 100 : n;
}

/** Accepts a YouTube URL or bare ID; returns the 11-character ID or null. */
export function youtubeId(v: unknown): string | null | undefined {
  const s = str(v, 200);
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : undefined;
}

export function validateMatch(raw: Record<string, unknown>, cat: Catalog) {
  const errors: string[] = [];
  const title = str(raw.title, 200);
  if (!title) errors.push('Title is required');
  const date = str(raw.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) errors.push('Date must be YYYY-MM-DD');
  const promotion = str(raw.promotion, 60);
  if (!cat.promotions.includes(promotion)) errors.push(`Unknown promotion "${promotion}"`);
  const event = str(raw.event, 200);
  if (!event) errors.push('Event is required');
  const wrestlers = list(raw.wrestlers, 30);
  if (!wrestlers.length) errors.push('Pick at least one wrestler');
  for (const w of wrestlers) if (!cat.wrestlers.includes(w)) errors.push(`Unknown wrestler "${w}" (add them first)`);
  const era = raw.era === 'classic' ? 'classic' : raw.era === 'modern' ? 'modern' : null;
  if (!era) errors.push('Era must be modern or classic');
  const type = slugify(str(raw.type, 40)) || 'singles';
  const yt = youtubeId(raw.youtube);
  if (yt === undefined) errors.push('YouTube: paste a youtube.com link or an 11-character video ID');
  const dna = list(raw.dna, 10);
  for (const d of dna) if (!cat.dna.includes(d)) errors.push(`Unknown Territory DNA pairing "${d}"`);

  const data: MatchInput = {
    title, date, promotion, event, venue: str(raw.venue, 200) || undefined, wrestlers, era: era ?? 'modern', type,
    title_match: str(raw.title_match, 200) || undefined, duration: str(raw.duration, 20) || undefined,
    result: str(raw.result, 200) || undefined,
    my_rating: rating(raw.my_rating, 5, 'My rating', errors, true),
    meltzer_rating: rating(raw.meltzer_rating, 10, 'Meltzer rating', errors),
    youtube: yt ?? null, where_to_watch: list(raw.where_to_watch, 10), dna,
    tags: list(raw.tags, 20).map(slugify).filter(Boolean), featured: raw.featured === true,
    summary: str(raw.summary, 300) || undefined, verify: list(raw.verify, 10),
  };
  if (data.duration && !/^\d{1,2}(:\d{2}){1,2}$/.test(data.duration)) errors.push('Time must look like 23:45 or 1:02:30');
  return { data, errors };
}

// JSON strings are valid YAML double-quoted strings, so this never needs a YAML library.
const q = (s: string) => JSON.stringify(s);
const arr = (a: string[], quote = true) => `[${a.map((x) => (quote ? q(x) : x)).join(', ')}]`;
const rv = (r: Rating) => (r === null ? 'null' : r === 'dud' ? 'dud' : String(r));

export function matchFile(d: MatchInput, body: string) {
  const lines = [
    `title: ${q(d.title)}`, `date: ${d.date}`, `promotion: ${d.promotion}`, `event: ${q(d.event)}`,
    d.venue && `venue: ${q(d.venue)}`, `wrestlers: ${arr(d.wrestlers, false)}`, `era: ${d.era}`, `type: ${d.type}`,
    d.title_match && `title_match: ${q(d.title_match)}`, d.duration && `duration: ${q(d.duration)}`,
    d.result && `result: ${q(d.result)}`, d.summary && `summary: ${q(d.summary)}`,
    `my_rating: ${rv(d.my_rating)}`, `meltzer_rating: ${rv(d.meltzer_rating)}`,
    `youtube: ${d.youtube ? q(d.youtube) : 'null'}`, `where_to_watch: ${arr(d.where_to_watch)}`,
    d.dna.length && `dna: ${arr(d.dna, false)}`, d.tags.length && `tags: ${arr(d.tags, false)}`,
    `featured: ${d.featured}`, `verify: ${arr(d.verify)}`,
  ].filter(Boolean);
  const text = body.replace(/\r\n/g, '\n').trim();
  return `---\n${lines.join('\n')}\n---\n${text ? `${text}\n` : ''}`;
}

export function wrestlerFile(name: string, eras: string[], promotions: string[]) {
  return `---\nname: ${q(name)}\npromotions: ${arr(promotions, false)}\neras: ${arr(eras, false)}\nfeatured: false\n---\n`;
}

export const matchSlug = (d: MatchInput) => `${d.date}-${slugify(d.title.replace(/\bvs\.?\b/gi, ' '))}`.slice(0, 90).replace(/-+$/, '');

export interface ColumnInput { title: string; date: string; series: 'i-was-there' | 'analysis'; summary: string; matches: string[]; wrestlers: string[]; featured: boolean }

export function validateColumn(raw: Record<string, unknown>, cat: Catalog) {
  const errors: string[] = [];
  const title = str(raw.title, 200);
  if (!title) errors.push('Title is required');
  const date = str(raw.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) errors.push('Date must be YYYY-MM-DD');
  const series = raw.series === 'analysis' ? 'analysis' : raw.series === 'i-was-there' ? 'i-was-there' : null;
  if (!series) errors.push('Pick a series: I Was There or Analysis');
  const summary = str(raw.summary, 300);
  if (!summary) errors.push('A one-line summary is required');
  const matches = list(raw.matches, 20);
  for (const m of matches) if (cat.matches && !cat.matches.includes(m)) errors.push(`Unknown match "${m}"`);
  const wrestlers = list(raw.wrestlers, 30);
  for (const w of wrestlers) if (!cat.wrestlers.includes(w)) errors.push(`Unknown wrestler "${w}"`);
  const data: ColumnInput = { title, date, series: series ?? 'analysis', summary, matches, wrestlers, featured: raw.featured === true };
  return { data, errors };
}

export function columnFile(d: ColumnInput, body: string) {
  const lines = [
    `title: ${q(d.title)}`, `date: ${d.date}`, `series: ${d.series}`, `summary: ${q(d.summary)}`,
    d.matches.length && `matches: ${arr(d.matches, false)}`, d.wrestlers.length && `wrestlers: ${arr(d.wrestlers, false)}`,
    `featured: ${d.featured}`,
  ].filter(Boolean);
  return `---\n${lines.join('\n')}\n---\n${body.replace(/\r\n/g, '\n').trim()}\n`;
}

export const columnSlug = (d: ColumnInput) => `${d.date}-${slugify(d.title)}`.slice(0, 90).replace(/-+$/, '');
