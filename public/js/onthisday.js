/* On this day: picks today's matches in the visitor's own time zone from
 * /data/on-this-day.json. Fills [data-otd] blocks and adds a ticker item.
 * With nothing on today's date, it shows the next date that has matches.
 */
(() => {
  const blocks = document.querySelectorAll('[data-otd]');
  const ticker = document.querySelector('.ticker-track');
  if (!blocks.length && !ticker) return;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const key = (d) => `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const label = (k) => { const [m, d] = k.split('-').map(Number); return `${MONTHS[m - 1]} ${d}`; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  fetch('/data/on-this-day.json').then((r) => r.json()).then((data) => {
    const today = new Date();
    let k = key(today), exact = true;
    if (!data[k]) {
      exact = false;
      for (let i = 1; i <= 366 && !data[k]; i++) k = key(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));
    }
    const list = data[k] || [];
    const years = (y) => today.getFullYear() - y;
    const card = (m) => `<a class="card reveal is-in" href="/matches/${esc(m.id)}/"><div class="card-meta"><span class="promo">${esc(m.promo)}</span><span>${m.year} · ${years(m.year)} years ago</span></div><h3>${esc(m.title)}</h3><p class="event">${esc(m.event)}</p><div class="card-foot"><span class="rating-who">Mine ${esc(m.mine ?? '—')}</span><span class="rating-who">Meltzer ${esc(m.meltzer ?? '—')}</span></div></a>`;
    const html = list.length
      ? `<p class="eyebrow">${exact ? 'Today' : 'Coming up'} · ${label(k)}</p><div class="grid">${list.map(card).join('')}</div><p style="margin-top:18px"><a class="see-all" href="/on-this-day/${k}/">All of ${label(k)}</a></p>`
      : '<p class="placeholder">No dated matches on the site yet.</p>';
    blocks.forEach((b) => { b.innerHTML = html; });
    const h = document.querySelector('[data-otd-heading]');
    if (h) h.innerHTML = `${exact ? 'Today' : 'Next up'}: <em>${label(k)}</em>`;
    if (ticker && list.length) {
      const m = list[0];
      document.querySelectorAll('.ticker-track').forEach((t) => {
        const li = document.createElement('li');
        li.innerHTML = `<b>On this day</b><a href="/matches/${esc(m.id)}/">${esc(m.title)}</a><span class="muted">${m.year}</span>`;
        t.prepend(li);
      });
    }
  }).catch(() => blocks.forEach((b) => { b.innerHTML = '<p class="placeholder">Couldn\'t load today\'s matches.</p>'; }));
})();
