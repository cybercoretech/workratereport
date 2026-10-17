/* The Workrate Report: theme engine.
 * Adapted from the Cybercore project-site kit (sigilward/docs/app.js).
 * Registry: https://cybercoretech.github.io/data (CORS *)
 *   cybergrid.json                     families → theme names
 *   themes/<family>/<name>.json        11-slot palettes
 * Signature mashups = surfaces from `base` + neons from `accent`.
 * TEN POUNDS OF GOLD is built in, so the site works with the registry offline.
 */
(() => {
  const root = document.documentElement;
  const DATA = 'https://cybercoretech.github.io/data';
  const STORE = 'cybercore-theme';
  const CACHE = 'wr-theme-palette';
  const DEFAULT = 'ten-pounds-of-gold';
  const BUILTIN = {
    'ten-pounds-of-gold': { bg: '111014', white: 'f3eee3', panel: '1b1a20', line: '34313b', muted: 'a59f97',
      orange: 'd4a537', red: 'c8102e', cyan: '3f7fd9', hot_pink: 'f2d27a', acid_green: '7ccf4f', purple: '8a6ad6' },
  };
  const MASHUPS = [
    { id: 'ten-pounds-of-gold', label: 'TEN POUNDS OF GOLD', recipe: 'BRAND PALETTE' },
    { id: 'starrcade-neon', label: 'STARRCADE NEON', base: 'cyberdyne-steel', accent: 'synthwave-sunset' },
    { id: 'wargames-steel', label: 'WARGAMES STEEL', base: 'blackbox-industrial', accent: 'cyberdyne-t800' },
    { id: 'nitro-nights', label: 'NITRO NIGHTS', base: 'neosynth-core', accent: 'cyberpunk-neon' },
    { id: 'dome-show', label: 'DOME SHOW', base: 'tokyo-night', accent: 'neosynth-plasma' },
    { id: 'bunkhouse', label: 'BUNKHOUSE', base: 'gruvbox-dark', accent: 'dystopian-ash' },
    { id: 'red-and-yellow', label: 'RED & YELLOW', base: 'dystopian-ash', accent: 'cyberdyne-t800' },
    { id: 'attitude', label: 'ATTITUDE', base: 'demon', accent: 'cyberdyne-judgment' },
  ];
  // Registry slot → site variable (BLUEPRINT §12.3)
  const VARS = { bg: '--ink', white: '--canvas', panel: '--panel', line: '--line', muted: '--muted',
    orange: '--gold', red: '--red', cyan: '--blue', hot_pink: '--hot', acid_green: '--acid', purple: '--purple',
    red_text: '--red-text', cyan_text: '--blue-text' };
  const SURFACE = ['bg', 'white', 'panel', 'line', 'muted'];
  const LABELS = { mashup: 'SIGNATURE MASHUPS', 'cybercore-tech': 'CYBERCORE TECH / MASTER MIX', cyberdyne: 'CYBERDYNE',
    cyberpunk: 'CYBERPUNK', default: 'DEFAULT / CLASSICS', dystopian: 'DYSTOPIAN', neosynth: 'NEOSYNTH',
    'omarchy-live': 'OMARCHY LIVE', synthwave: 'SYNTHWAVE' };
  const display = (s) => s.replaceAll('-', ' ').toUpperCase();
  const mashOf = (id) => MASHUPS.find((m) => m.id === id);

  let families = {};
  const familyOf = (name) => Object.keys(families).find((f) => families[f].includes(name));
  const cache = {};

  async function palette(name) {
    if (BUILTIN[name]) return BUILTIN[name];
    if (cache[name]) return cache[name];
    const family = familyOf(name);
    if (!family) throw new Error(`unknown theme ${name}`);
    const res = await fetch(`${DATA}/themes/${family}/${name}.json`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return (cache[name] = await res.json());
  }

  async function resolve(name) {
    const mash = mashOf(name);
    if (!mash || !mash.base) return palette(name);
    const [base, accent] = await Promise.all([palette(mash.base), palette(mash.accent)]);
    const out = { ...accent };
    SURFACE.forEach((k) => { out[k] = base[k]; });
    return out;
  }

  function paint(name, raw) {
    // Readability first: nudge any too-faint text colour (see /js/contrast.js).
    const p = window.WRContrast ? window.WRContrast.guard(raw).palette : raw;
    const vars = {};
    Object.entries(VARS).forEach(([k, v]) => { if (p[k]) vars[v] = `#${p[k]}`; });
    Object.entries(vars).forEach(([v, c]) => root.style.setProperty(v, c));
    root.dataset.theme = name;
    try { localStorage.setItem(CACHE, JSON.stringify(vars)); } catch {}
    const mash = mashOf(name);
    document.querySelectorAll('[data-active-theme]').forEach((el) => { el.textContent = mash ? mash.label : display(name); });
    document.querySelectorAll('[data-theme-recipe]').forEach((el) => {
      el.textContent = mash ? (mash.base ? `${display(mash.base)} × ${display(mash.accent)}` : mash.recipe) : 'FAMILY PALETTE';
    });
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', vars['--ink']));
    syncMenus(name);
  }

  async function apply(name, { persist = true } = {}) {
    try { paint(name, await resolve(name)); } catch (e) { console.warn('theme', e); paint(DEFAULT, BUILTIN[DEFAULT]); return; }
    if (!persist) return;
    try { localStorage.setItem(STORE, name); } catch {}
    const url = new URL(location.href);
    if (name === DEFAULT) url.searchParams.delete('theme'); else url.searchParams.set('theme', name);
    history.replaceState(null, '', url);
  }

  /* ---------- categorized listbox menus (header + drawer) ---------- */
  const pickers = [...document.querySelectorAll('[data-theme-picker]')];
  const optionsFor = () => [['mashup', MASHUPS.map((m) => ({ value: m.id, text: m.label }))],
    ...Object.entries(families).map(([f, names]) => [f, names.map((n) => ({ value: n, text: display(n) }))])];

  function build() {
    const groups = optionsFor();
    const total = groups.reduce((n, [, list]) => n + list.length, 0);
    document.querySelectorAll('[data-theme-count]').forEach((el) => { el.textContent = `${total} THEMES`; });
    for (const picker of pickers) {
      const menu = picker.querySelector('[role="listbox"]');
      menu.textContent = '';
      for (const [family, list] of groups) {
        const h = document.createElement('div');
        h.className = 'theme-group-label';
        h.textContent = LABELS[family] || display(family);
        menu.append(h);
        for (const o of list) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'theme-option'; b.setAttribute('role', 'option');
          b.dataset.value = o.value; b.textContent = o.text;
          b.addEventListener('click', () => { apply(o.value); close(picker); });
          menu.append(b);
        }
      }
    }
    syncMenus(root.dataset.theme || DEFAULT);
  }

  function syncMenus(name) {
    for (const picker of pickers) {
      picker.querySelectorAll('.theme-option').forEach((o) => o.setAttribute('aria-selected', String(o.dataset.value === name)));
    }
  }

  function open(picker) {
    pickers.forEach((p) => p !== picker && close(p));
    const btn = picker.querySelector('[aria-haspopup]');
    const menu = picker.querySelector('[role="listbox"]');
    menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    // Inside the drawer the page can't scroll, so bring the open menu into view.
    if (picker.closest('.drawer')) picker.scrollIntoView({ block: 'nearest' });
    const sel = menu.querySelector('[aria-selected="true"]');
    // Scroll only the menu; scrollIntoView would move the page too.
    if (sel) menu.scrollTop = sel.offsetTop - menu.clientHeight / 2;
    (sel || menu.querySelector('.theme-option'))?.focus({ preventScroll: true });
  }
  function close(picker, { restore = false } = {}) {
    const btn = picker.querySelector('[aria-haspopup]');
    const menu = picker.querySelector('[role="listbox"]');
    if (menu.hidden) return;
    menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
    if (restore) btn.focus();
  }
  for (const picker of pickers) {
    const btn = picker.querySelector('[aria-haspopup]');
    const menu = picker.querySelector('[role="listbox"]');
    btn.addEventListener('click', () => (menu.hidden ? open(picker) : close(picker)));
    menu.addEventListener('keydown', (e) => {
      const opts = [...menu.querySelectorAll('.theme-option')];
      const i = opts.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(i + 1, opts.length - 1)]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(i - 1, 0)]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); opts[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); opts.at(-1)?.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(picker, { restore: true }); }
    });
  }
  document.addEventListener('pointerdown', (e) => {
    pickers.forEach((p) => { if (!p.contains(e.target)) close(p); });
  });

  /* ---------- boot ---------- */
  async function boot() {
    try {
      const res = await fetch(`${DATA}/cybergrid.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const grid = await res.json();
      families = grid.families || grid;
    } catch (e) {
      console.warn('theme registry offline; using built-in palette', e);
      families = {};
    }
    build();
    const known = (n) => n && (mashOf(n) || familyOf(n));
    const requested = new URLSearchParams(location.search).get('theme');
    let saved = null; try { saved = localStorage.getItem(STORE); } catch {}
    if (known(requested)) apply(requested);
    else if (known(saved)) apply(saved, { persist: false });
    else apply(DEFAULT, { persist: false });
  }
  boot();
})();
