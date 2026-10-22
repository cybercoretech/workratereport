// Small index for the client-side "On this day" blocks (home, ticker, /on-this-day/).
import { getEntry } from 'astro:content';
import { matches } from '../../lib/site';
import { mmdd } from '../../lib/onthisday';
import { text } from '../../lib/ratings';
export async function GET() {
  const out: Record<string, unknown[]> = {};
  for (const m of await matches()) {
    const p = await getEntry(m.data.promotion);
    (out[mmdd(m.data.date)] ??= []).push({ id: m.id, title: m.data.title, event: m.data.event, year: m.data.date.getUTCFullYear(),
      promo: p?.data.short ?? '', mine: m.data.my_rating === null ? null : text(m.data.my_rating), meltzer: m.data.meltzer_rating === null ? null : text(m.data.meltzer_rating) });
  }
  return new Response(JSON.stringify(out), { headers: { 'content-type': 'application/json; charset=utf-8' } });
}
