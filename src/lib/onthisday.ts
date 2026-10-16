import { matches, type Match } from './site';
export const mmdd = (d: Date) => `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const dayLabel = (k: string) => { const [m, d] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${d}`; };
/** Every calendar day (including Feb 29). */
export const allDays = () => Array.from({ length: 366 }, (_, i) => mmdd(new Date(Date.UTC(2024, 0, 1 + i))));
export async function byDay() {
  const map = new Map<string, Match[]>();
  for (const m of await matches()) { const k = mmdd(m.data.date); map.set(k, [...(map.get(k) ?? []), m]); }
  for (const list of map.values()) list.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  return map;
}
