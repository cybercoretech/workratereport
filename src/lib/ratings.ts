export type Rating = number | 'dud' | null;

/** Numeric value used for sorting and comparisons. DUD sorts as 0, unrated as -Infinity. */
export const value = (r: Rating) => (r === null ? -Infinity : r === 'dud' ? 0 : r);

const FRACTIONS: Record<string, string> = { '0.25': '¼', '0.5': '½', '0.75': '¾' };

/** Meltzer-style text: "****½", "DUD", "-**", "Not rated". */
export function text(r: Rating): string {
  if (r === null) return 'Not rated';
  if (r === 'dud') return 'DUD';
  const sign = r < 0 ? '-' : '';
  const abs = Math.abs(r);
  // Meltzer past our cap reads as 6★, 7★
  if (abs > 5) return `${sign}${abs}★`;
  // Precise ratings (4.89) read as numbers; quarter steps keep the classic look.
  if (Math.round(abs * 4) !== abs * 4) return `${sign}${abs.toFixed(2)}★`;
  const whole = Math.floor(abs);
  const frac = FRACTIONS[(abs - whole).toFixed(2).replace(/0$/, '')] ?? '';
  if (whole === 0 && frac) return sign + frac + '*';
  return sign + '★'.repeat(whole) + frac;
}

/** Accessible label: "4.75 out of 5 stars". */
export function label(r: Rating, of = 5): string {
  if (r === null) return 'Not rated yet';
  if (r === 'dud') return 'DUD';
  if (r < 0) return `minus ${Math.abs(r)} stars`;
  return `${Number.isInteger(r * 4) ? r : r.toFixed(2)} out of ${of} stars`;
}

export const isFiveStar = (r: Rating) => typeof r === 'number' && r >= 5;
