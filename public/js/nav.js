/* Hamburger drawer ("the ropes"). Pattern from Neon Coffin Video store-nav.js:
 * aria-expanded/label toggling, Escape + outside click close, focus return,
 * links close the drawer. Adds: scroll lock, focus trap, group expanders.
 */
(() => {
  const toggle = document.querySelector('.menu-toggle');
  const drawer = document.querySelector('#siteDrawer');
  const scrim = document.querySelector('.drawer-scrim');
  if (!toggle || !drawer) return;

  const focusables = () => [...drawer.querySelectorAll('a[href], button:not([disabled])')]
    .filter((el) => el.offsetParent !== null);

  function setOpen(open, { restoreFocus = false } = {}) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close site navigation' : 'Open site navigation');
    drawer.dataset.open = String(open);
    drawer.inert = !open;
    scrim.hidden = !open;
    document.documentElement.classList.toggle('drawer-open', open);
    if (open) requestAnimationFrame(() => focusables()[0]?.focus({ preventScroll: true }));
    else if (restoreFocus) toggle.focus();
  }
  drawer.inert = true;

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  scrim.addEventListener('click', () => setOpen(false));
  drawer.querySelector('.drawer-close')?.addEventListener('click', () => setOpen(false, { restoreFocus: true }));
  drawer.addEventListener('click', (e) => { if (e.target.closest('a[href]')) setOpen(false); });

  document.addEventListener('keydown', (e) => {
    if (drawer.dataset.open !== 'true') return;
    if (e.key === 'Escape' && !e.target.closest('[role="listbox"]')) { setOpen(false, { restoreFocus: true }); return; }
    if (e.key !== 'Tab') return;
    const f = focusables();
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });

  // Section groups: expand to show sub-pages.
  drawer.querySelectorAll('.drawer-expand').forEach((btn) => {
    const list = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '−' : '+';
      list.hidden = !open;
    });
  });

  matchMedia("(min-width: 1180px)").addEventListener('change', () => setOpen(false));
})();
