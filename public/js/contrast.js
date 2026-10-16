/* The Workrate Report: contrast guard (WCAG 2.x).
 * Every theme (registry palettes and mashups) passes through guard()
 * before it's painted. Any text colour that's too faint on its background
 * is pushed away from the background (lighter on dark themes, darker on
 * light ones) until it meets the target ratio. Shared by /js/theme.js and
 * scripts/contrast-audit.mjs, so the audit measures exactly what ships.
 */
(function (root, factory) {
  if (typeof module === 'object' && module) module.exports = factory();
  else root.WRContrast = factory();
})(this, function () {
  const hex = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
  const toHex = (rgb) => rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A.map((v, i) => v + (B[i] - v) * t)); };

  /** Move fg toward white (or black) until it reaches `target` against bg. */
  function fix(fg, bg, target) {
    if (ratio(fg, bg) >= target) return fg;
    const pole = lum(bg) < 0.4 ? 'ffffff' : '000000';
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const c = mix(fg, pole, t);
      if (ratio(c, bg) >= target) return c;
    }
    return pole;
  }

  // [foreground slot, background slots, minimum ratio]. 4.5 = AA body text.
  const RULES = [
    ['white', ['bg', 'panel'], 7],         // main text
    ['muted', ['bg', 'panel'], 4.5],       // secondary text
    ['orange', ['bg', 'panel'], 4.5],      // gold: links, eyebrows, stars, and ink-on-gold buttons
    // Red and blue stay true for backgrounds (ropes, LIVE badge, tiles); text
    // uses separate readable copies, red_text and cyan_text.
    ['red_text', ['bg'], 4.5],             // Modern Era badges, DUD stamps
    ['cyan_text', ['bg'], 4.5],            // Territory DNA badges
    ['hot_pink', ['bg'], 4.5],             // warnings, draft badges
    ['acid_green', ['bg'], 4.5],           // success messages
  ];

  function guard(p) {
    const out = { ...p, red_text: p.red, cyan_text: p.cyan };
    const changes = [];
    for (const [fg, bgs] of RULES.map((r) => [r[0], r[1]])) {
      const target = RULES.find((r) => r[0] === fg)[2];
      if (!out[fg]) continue;
      let c = out[fg];
      for (const bg of bgs) if (out[bg]) c = fix(c, out[bg], target);
      if (c !== out[fg]) changes.push({ slot: fg, from: out[fg], to: c });
      out[fg] = c;
    }
    return { palette: out, changes };
  }

  function report(p) {
    return RULES.flatMap(([fg, bgs, target]) => bgs.filter((bg) => p[fg] && p[bg]).map((bg) => ({ fg, bg, target, ratio: ratio(p[fg], p[bg]) })));
  }

  return { guard, report, ratio };
});
