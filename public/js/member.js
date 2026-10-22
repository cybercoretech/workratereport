/* The Workrate Report: member features on every page.
 * - Header account button (Sign in, or your avatar and handle)
 * - Fan ratings on match pages ([data-fan-rating="<match id>"])
 * - Public profile pages (/u/<handle>/, [data-profile])
 * Talks to /api/me, /api/ratings/<id>, /api/members/<handle>.
 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const avatar = (a) => `/avatars/${esc(String(a || 'preset:belt').replace(/^preset:/, ''))}.svg`;
  const json = async (url, opts = {}) => {
    const res = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'content-type': 'application/json', ...(opts.headers || {}) } });
    let body = {}; try { body = await res.json(); } catch {}
    return { status: res.status, ...body };
  };
  const here = () => location.pathname + location.search;
  let me = null;

  /* ---------- header button ---------- */
  async function header() {
    const slot = $('[data-account]');
    const r = await json('/api/me');
    me = r.member || null;
    if (!slot) return;
    if (me) {
      slot.innerHTML = `<a class="account-btn" href="/account/" aria-label="Your account: ${esc(me.display_name)}"><img src="${avatar(me.avatar)}" alt="" width="30" height="30" /><span>${esc(me.display_name)}</span></a>`;
    } else {
      slot.innerHTML = `<a class="account-btn signin" href="/account/?return=${encodeURIComponent(here())}">Sign in</a>`;
    }
  }

  /* ---------- fan ratings ---------- */
  function starRow(r) {
    return `<span class="stars lg is-in" style="--r:${r === null ? 0 : r / 5}"><span class="stars-row"><i></i></span></span>`;
  }
  async function fanRating(el) {
    const id = el.dataset.fanRating;
    const render = (s) => {
      const avg = s.average === null ? '<span class="unrated">No fan ratings yet</span>' : `${starRow(s.average)}<span class="fan-avg">${s.average.toFixed(2)}</span>`;
      const count = `<span class="muted fan-count">${s.count} ${s.count === 1 ? 'fan' : 'fans'}</span>`;
      let control = '';
      if (s.signedIn) {
        const v = s.mine ?? 3;
        control = `<div class="fan-control"><label class="visually-hidden" for="fanRange-${esc(id)}">Your rating</label>
          <input type="range" min="0" max="5" step="0.25" value="${v}" id="fanRange-${esc(id)}" />
          <output>${s.mine === null ? 'Rate it' : `${s.mine.toFixed(2)}`}</output>
          <button type="button" class="btn" data-fan-save>${s.mine === null ? 'Rate' : 'Update'}</button>
          ${s.mine !== null ? '<button type="button" class="linkish" data-fan-clear>Remove</button>' : ''}</div>`;
      } else {
        control = `<p class="fan-signin"><a href="/account/?return=${encodeURIComponent(here())}">Sign in</a> to add your rating.</p>`;
      }
      el.innerHTML = `<span class="rating-who">Fans</span><div class="fan-summary">${avg}${count}</div>${control}<p class="fan-msg" role="status" aria-live="polite"></p>`;
      const range = el.querySelector('input[type=range]');
      if (range) {
        const out = el.querySelector('output');
        range.addEventListener('input', () => { out.textContent = Number(range.value).toFixed(2); });
        el.querySelector('[data-fan-save]').addEventListener('click', async () => {
          const r = await json(`/api/ratings/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify({ rating: Number(range.value) }) });
          if (r.ok) { render(r); el.querySelector('.fan-msg').textContent = 'Thanks, your rating is in.'; } else el.querySelector('.fan-msg').textContent = r.error || 'Could not save';
        });
        el.querySelector('[data-fan-clear]')?.addEventListener('click', async () => {
          const r = await json(`/api/ratings/${encodeURIComponent(id)}`, { method: 'DELETE', body: '{}' });
          if (r.ok) render(r);
        });
      }
    };
    const s = await json(`/api/ratings/${encodeURIComponent(id)}`);
    if (s.status === 404 || s.ok === false) { el.innerHTML = '<span class="rating-who">Fans</span><span class="unrated">Fan ratings are coming soon</span>'; return; }
    render(s);
  }

  /* ---------- public profile ---------- */
  async function profile(el) {
    const handle = decodeURIComponent(location.pathname.replace(/^\/u\/?/, '').replace(/\/$/, ''));
    if (!handle) { el.innerHTML = '<p class="placeholder">No member chosen. Try <a href="/account/">your account</a>.</p>'; return; }
    const [r, titles] = await Promise.all([
      json(`/api/members/${encodeURIComponent(handle)}`),
      // Match titles for the ratings list (catalog.json is cached by the browser).
      fetch('/data/catalog.json').then((x) => x.json()).then((c) => Object.fromEntries(c.matches.map((m) => [m.id, `${m.data.title} · ${m.data.event}`]))).catch(() => ({})),
    ]);
    if (!r.ok) { el.innerHTML = `<p class="placeholder">${esc(r.error || 'No member with that handle.')}</p>`; return; }
    const m = r.member;
    document.title = `${m.display_name} · The Workrate Report`;
    const facts = [['Watching since', m.watching_since], ['Favorite era', m.favorite_era], ['Favorite promotion', m.favorite_promotion], ['Favorite wrestler', m.favorite_wrestler],
      ['Member since', m.joined ? new Date(m.joined * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : null]].filter(([, v]) => v);
    el.innerHTML = `
      <div class="member-head">
        <img class="member-avatar" src="${avatar(m.avatar)}" alt="" width="128" height="128" />
        <div><p class="eyebrow">${m.role === 'admin' ? 'The Workrate Report' : 'Member'}</p><h1>${esc(m.display_name)}</h1><p class="muted">@${esc(m.handle)}</p>
        ${r.self ? '<a class="btn ghost" href="/account/">Edit your profile</a>' : ''}</div>
      </div>
      ${m.hidden ? '<p class="placeholder">This profile is private.</p>' : `
        ${m.bio ? `<div class="prose member-bio">${esc(m.bio).replace(/\n/g, '<br />')}</div>` : ''}
        ${facts.length ? `<table class="facts" style="max-width:520px;margin-top:20px"><tbody>${facts.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
        <h2 style="margin-top:40px">Recent ratings</h2>
        ${(r.ratings || []).length ? `<ul class="member-ratings">${r.ratings.map((x) => `<li><a href="/matches/${esc(x.match_id)}/">${esc(titles[x.match_id] || x.match_id)}</a> <span class="fan-avg">${Number(x.rating).toFixed(2)}★</span></li>`).join('')}</ul>` : '<p class="muted">No ratings yet.</p>'}`}`;
  }

  // Other page scripts wait on `WRMember.ready` (a promise, so it can't be
  // missed the way an event could if it fired before they loaded).
  const ready = header().then(() => {
    document.querySelectorAll('[data-fan-rating]').forEach(fanRating);
    document.querySelectorAll('[data-profile]').forEach(profile);
    document.dispatchEvent(new CustomEvent('wr:member', { detail: me }));
    return me;
  });
  window.WRMember = { json, avatar, esc, ready, get me() { return me; } };
})();
