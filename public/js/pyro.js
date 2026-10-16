/* The Workrate Report: "Pyro" effects (BLUEPRINT §12.2).
 * Techniques from Neon Coffin Video (night-effects.js, neon-polish.js).
 * Rules: everything hangs off html.pyro; reduced-motion disables all of it;
 * canvas loops only run while visible and stop when the tab is hidden;
 * pointer effects need a fine pointer. Content never depends on any of this.
 */
(() => {
  const root = document.documentElement;
  const KEY = 'wr-pyro';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let want = true;
  try { want = localStorage.getItem(KEY) !== 'off'; } catch {}
  const on = () => root.classList.contains('pyro');
  const sync = () => root.classList.toggle('pyro', want && !reduced.matches);
  sync();
  reduced.addEventListener('change', sync);

  document.querySelectorAll('[data-pyro-toggle]').forEach((btn) => {
    const label = () => { btn.setAttribute('aria-pressed', String(want)); btn.querySelector('[data-pyro-state]').textContent = want ? 'ON' : 'OFF'; };
    label();
    btn.addEventListener('click', () => {
      want = !want;
      try { localStorage.setItem(KEY, want ? 'on' : 'off'); } catch {}
      sync();
      document.querySelectorAll('[data-pyro-toggle]').forEach((b) => { b.setAttribute('aria-pressed', String(want)); b.querySelector('[data-pyro-state]').textContent = want ? 'ON' : 'OFF'; });
    });
  });

  /* Rope progress bar */
  const rope = document.querySelector('.rope-progress');
  if (rope) {
    let queued = false;
    const update = () => {
      queued = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      rope.style.setProperty('--p', max > 0 ? String(Math.min(1, scrollY / max)) : '0');
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* Reveal: cards rise in, stars fill, stamps slam, numbers count up */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      el.classList.add('is-in');
      io.unobserve(el);
      if (el.matches('[data-count]')) countUp(el);
      if (el.matches('.five-star-burst')) burst(el);
    }
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  function arm(scope = document) {
    const groups = new Map();
    scope.querySelectorAll('.reveal, .stars, .stamp, [data-count], .five-star-burst').forEach((el) => {
      if (!io) { el.classList.add('is-in'); return; }
      const parent = el.parentElement;
      const i = groups.get(parent) || 0;
      groups.set(parent, i + 1);
      if (el.classList.contains('reveal')) el.style.setProperty('--delay', `${Math.min(i * 60, 360)}ms`);
      io.observe(el);
    });
  }
  arm();
  document.addEventListener('wr:grid-updated', (e) => arm(e.target));

  function countUp(el) {
    const end = Number(el.dataset.count);
    if (!on() || !Number.isFinite(end)) { el.textContent = String(end); return; }
    const t0 = performance.now(), dur = 1100;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* Pyro burst: canvas sparks from the bottom corners, ~1.2 s, 30 fps cap */
  function burst(host) {
    if (!on() || document.hidden) return;
    const c = document.createElement('canvas');
    c.className = 'pyro-canvas';
    c.setAttribute('aria-hidden', 'true');
    host.append(c);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = host.getBoundingClientRect();
    c.width = r.width * dpr; c.height = r.height * dpr;
    const g = c.getContext('2d');
    g.scale(dpr, dpr);
    const css = getComputedStyle(root);
    const colors = ['--gold', '--hot', '--canvas', '--red'].map((v) => css.getPropertyValue(v).trim() || '#d4a537');
    const sparks = [];
    for (const side of [0, 1]) {
      for (let i = 0; i < 70; i++) {
        const a = (side ? Math.PI * 1.25 : Math.PI * 1.75) + (Math.random() - 0.5) * 0.6;
        const s = 5 + Math.random() * 7;
        sparks.push({ x: side ? r.width - 8 : 8, y: r.height - 4, vx: Math.cos(a) * s * (side ? 1 : 1), vy: Math.sin(a) * s,
          life: 1, decay: 0.018 + Math.random() * 0.02, color: colors[i % colors.length], size: 1 + Math.random() * 2.2 });
      }
    }
    let last = 0;
    const frame = (t) => {
      if (t - last < 33) { requestAnimationFrame(frame); return; }
      last = t;
      g.clearRect(0, 0, r.width, r.height);
      let alive = 0;
      for (const p of sparks) {
        if (p.life <= 0) continue;
        alive++;
        p.x += p.vx; p.y += p.vy; p.vy += 0.32; p.vx *= 0.985; p.life -= p.decay;
        g.globalAlpha = Math.max(0, p.life);
        g.fillStyle = p.color;
        g.fillRect(p.x, p.y, p.size, p.size * 2.4);
      }
      if (alive && !document.hidden) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  }

  /* Pointer spotlight on heroes (rAF-throttled, fine pointers only) */
  document.querySelectorAll('.hero').forEach((hero) => {
    let raf = 0;
    hero.addEventListener('pointermove', (e) => {
      if (!on() || !fine.matches) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const b = hero.getBoundingClientRect();
        hero.style.setProperty('--spot-x', `${((e.clientX - b.left) / b.width) * 100}%`);
        hero.style.setProperty('--spot-y', `${((e.clientY - b.top) / b.height) * 100}%`);
      });
    });
  });

  /* Holo-foil tilt on cards */
  function tilt(scope = document) {
    scope.querySelectorAll('.card:not([data-tilt])').forEach((card) => {
      card.dataset.tilt = '';
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        if (!on() || !fine.matches) return;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const b = card.getBoundingClientRect();
          const x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
          card.style.setProperty('--rx', `${(0.5 - y) * 8}deg`);
          card.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
          card.style.setProperty('--fx', `${x * 100}%`);
          card.style.setProperty('--fy', `${y * 100}%`);
        });
      });
      card.addEventListener('pointerleave', () => { ['--rx', '--ry'].forEach((v) => card.style.setProperty(v, '0deg')); });
    });
  }
  tilt();
  document.addEventListener('wr:grid-updated', (e) => tilt(e.target));

  /* Camera flashes: random flash points in the crowd (heroes + 5-star cards) */
  const flashHosts = [...document.querySelectorAll('.hero, .card.is-five')];
  const visible = new Set();
  if (flashHosts.length && io) {
    const fio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target))));
    flashHosts.forEach((h) => fio.observe(h));
    setInterval(() => {
      if (!on() || document.hidden || !visible.size) return;
      const list = [...visible];
      const host = list[Math.floor(Math.random() * list.length)];
      if (host.classList.contains('card') && !host.matches(':hover')) return;
      const f = document.createElement('i');
      f.className = 'flash';
      f.setAttribute('aria-hidden', 'true');
      f.style.left = `${5 + Math.random() * 90}%`;
      f.style.top = `${8 + Math.random() * 70}%`;
      host.append(f);
      f.addEventListener('animationend', () => f.remove());
    }, 650);
  }

  /* Ticker: duplicate the track so the marquee loops seamlessly */
  document.querySelectorAll('.ticker-track').forEach((t) => {
    const copy = t.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    t.after(copy);
  });
})();
