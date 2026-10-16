/* The Workrate Report: Author's Desk (owner only).
 * Talks to /api/desk/* (Cloudflare Pages Functions). Publishing commits a
 * Markdown file to GitHub; Cloudflare rebuilds the site in about a minute.
 * Unsaved work is kept in this browser (localStorage) until it's published.
 */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const api = async (path, opts = {}) => {
    const res = await fetch(`/api/desk/${path}`, {
      credentials: 'same-origin',
      ...opts,
      headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
    });
    let body = {};
    try { body = await res.json(); } catch {}
    return { status: res.status, ...body };
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const stars = (r) => {
    if (r === null) return '<span class="unrated">Not rated yet</span>';
    if (r === 'dud') return '<span class="stamp is-in">DUD</span>';
    if (r < 0) return `<span class="stamp is-in">MINUS ${-r}★</span>`;
    return `<span class="stars lg is-in" style="--r:${Math.min(5, r) / 5}"><span class="stars-row"><i></i></span><span class="stars-text">${r} / 5</span></span>`;
  };

  const login = $('#deskLogin'), app = $('#deskApp'), form = $('#matchForm');
  let catalog = { promotions: [], wrestlers: [], dna: [], matches: [] };
  let current = null;          // match id being edited, or null for new
  let chosen = [];             // wrestler ids
  let my = { mode: 'none', value: 0 };

  /* ---------- session ---------- */
  async function boot() {
    const s = await api('session');
    if (s.status === 503) { login.hidden = false; $('#loginMsg').textContent = s.error; $('#loginForm button').disabled = true; return; }
    if (!s.ok) { login.hidden = false; $('input[name=password]', login).focus(); return; }
    if (!s.publishing) { $('#configMsg').hidden = false; $('#configMsg').textContent = 'Publishing is not set up yet: the GitHub token (DESK_GITHUB_TOKEN) is missing. You can write, and drafts are kept in this browser.'; }
    login.hidden = true; app.hidden = false;
    await loadCatalog();
    openMatch(null);
    loadLog();
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#loginMsg');
    msg.textContent = 'Checking…';
    const r = await api('login', { method: 'POST', body: JSON.stringify({ password: e.target.elements.password.value }) });
    e.target.elements.password.value = '';
    if (r.ok) { msg.textContent = ''; boot(); return; }
    msg.textContent = r.status === 429 ? r.error : `${r.error || 'Sign-in failed'}${r.attemptsLeft !== undefined ? ` (${r.attemptsLeft} tries left)` : ''}`;
  });
  $('#logout').addEventListener('click', async () => { await api('logout', { method: 'POST', body: '{}' }); location.reload(); });

  /* ---------- catalog + lists ---------- */
  async function loadCatalog() {
    catalog = await (await fetch('/data/catalog.json', { cache: 'no-store' })).json();
    try {
      // Matches/wrestlers published since the last deploy live here until the rebuild lands.
      const extra = JSON.parse(localStorage.getItem('wr-desk-recent') || '{}');
      for (const w of extra.wrestlers || []) if (!catalog.wrestlers.some((x) => x.id === w.id)) catalog.wrestlers.push(w);
      for (const m of extra.matches || []) {
        const i = catalog.matches.findIndex((x) => x.id === m.id);
        if (i === -1) catalog.matches.unshift(m); else if (m.at > Date.parse(catalog.built)) catalog.matches[i] = m;
      }
    } catch {}
    $('#promotionSelect').innerHTML = catalog.promotions.map((p) => `<option value="${esc(p.id)}">${esc(p.short)} · ${esc(p.name)}</option>`).join('');
    $('#addWrestlerPromos').innerHTML = catalog.promotions.map((p) => `<label class="check"><input type="checkbox" name="promo" value="${esc(p.id)}" /> ${esc(p.short)}</label>`).join('');
    $('#wrestlerOptions').innerHTML = catalog.wrestlers.map((w) => `<option value="${esc(w.name)}"></option>`).join('');
    $('#dnaBoxes').innerHTML = catalog.dna.map((d) => `<label class="check"><input type="checkbox" name="dna" value="${esc(d.id)}" /> ${esc(d.title)}</label>`).join('') || '<span class="desk-hint">No pairings yet.</span>';
    renderList();
  }
  function remember(kind, item) {
    try {
      const extra = JSON.parse(localStorage.getItem('wr-desk-recent') || '{}');
      extra[kind] = [item, ...(extra[kind] || []).filter((x) => x.id !== item.id)].slice(0, 50);
      localStorage.setItem('wr-desk-recent', JSON.stringify(extra));
    } catch {}
  }

  function renderList() {
    const q = $('#matchSearch').value.toLowerCase().trim();
    const list = catalog.matches.filter((m) => !q || `${m.data.title} ${m.data.event} ${m.data.date}`.toLowerCase().includes(q));
    $('#matchList').innerHTML = list.map((m) => `
      <li><button type="button" data-open="${esc(m.id)}" aria-current="${m.id === current}">
        <b>${esc(m.data.title)}</b><span>${esc(m.data.event)} · ${esc(m.data.date)}</span>
        <em>${m.data.my_rating === null ? 'Not rated' : m.data.my_rating === 'dud' ? 'DUD' : `${m.data.my_rating}★`}${m.body ? ' · reviewed' : ''}</em>
      </button></li>`).join('') || '<li class="desk-hint">No matches found.</li>';
  }
  $('#matchSearch').addEventListener('input', renderList);
  $('#matchList').addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openMatch(b.dataset.open);
  });
  $('#newMatch').addEventListener('click', () => openMatch(null));

  async function loadLog() {
    const r = await api('log');
    $('#publishLog').innerHTML = (r.entries || []).map((x) => `<li>${esc(new Date(x.at * 1000).toLocaleString())}: ${esc(x.title)}</li>`).join('') || '<li class="desk-hint">Nothing yet.</li>';
  }

  /* ---------- form ---------- */
  const lines = (s) => s.split('\n').map((x) => x.trim()).filter(Boolean);
  const draftKey = () => `wr-desk-draft:${current || 'new'}`;

  function fill(d, body) {
    for (const k of ['title', 'date', 'event', 'venue', 'duration', 'title_match', 'result', 'summary']) form.elements[k].value = d[k] ?? '';
    form.elements.promotion.value = d.promotion || catalog.promotions[0]?.id || '';
    form.elements.era.value = d.era || 'modern';
    form.elements.type.value = [...form.elements.type.options].some((o) => o.value === d.type) ? d.type : (d.type ? 'other' : 'singles');
    form.elements.meltzer_rating.value = d.meltzer_rating ?? '';
    form.elements.youtube.value = d.youtube ?? '';
    form.elements.where_to_watch.value = (d.where_to_watch || []).join('\n');
    form.elements.tags.value = (d.tags || []).join(', ');
    form.elements.verify.value = (d.verify || []).join('\n');
    form.elements.featured.checked = Boolean(d.featured);
    $$('input[name=dna]').forEach((c) => { c.checked = (d.dna || []).includes(c.value); });
    form.elements.body.value = body ?? '';
    chosen = [...(d.wrestlers || [])];
    const r = d.my_rating ?? null;
    my = r === null ? { mode: 'none', value: 0 } : r === 'dud' ? { mode: 'dud', value: 0 } : r < 0 ? { mode: 'negative', value: -r } : { mode: 'stars', value: r };
    renderChips(); renderRating(); renderYt(); renderPreview();
  }

  function openMatch(id) {
    current = id;
    const m = id && catalog.matches.find((x) => x.id === id);
    $('#formMode').textContent = m ? `Editing · ${m.id}` : 'New match';
    fill(m ? m.data : {}, m ? m.body : '');
    $('#saveMsg').textContent = '';
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(draftKey()) || 'null'); } catch {}
    if (draft) {
      fill(draft.data, draft.body);
      $('#draftNote').innerHTML = 'Restored your unpublished draft. <button type="button" class="linkish" id="discardDraft">Discard it</button>';
      $('#discardDraft').addEventListener('click', () => { try { localStorage.removeItem(draftKey()); } catch {} openMatch(current); });
    } else $('#draftNote').textContent = '';
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function collect() {
    const melt = form.elements.meltzer_rating.value.trim().toLowerCase();
    return {
      title: form.elements.title.value, date: form.elements.date.value, promotion: form.elements.promotion.value, event: form.elements.event.value,
      venue: form.elements.venue.value, wrestlers: chosen, era: form.elements.era.value, type: form.elements.type.value,
      title_match: form.elements.title_match.value, duration: form.elements.duration.value, result: form.elements.result.value,
      my_rating: my.mode === 'none' ? null : my.mode === 'dud' ? 'dud' : my.mode === 'negative' ? -Math.abs(Number($('#negValue').value)) : my.value,
      meltzer_rating: melt === '' ? null : melt === 'dud' ? 'dud' : Number(melt),
      youtube: form.elements.youtube.value.trim() || null, where_to_watch: lines(form.elements.where_to_watch.value),
      dna: $$('input[name=dna]:checked').map((c) => c.value),
      tags: form.elements.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
      featured: form.elements.featured.checked, summary: form.elements.summary.value, verify: lines(form.elements.verify.value),
    };
  }

  let draftTimer = 0;
  form.addEventListener('input', () => {
    renderPreview(); renderYt();
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try { localStorage.setItem(draftKey(), JSON.stringify({ data: collect(), body: form.elements.body.value, at: Date.now() })); } catch {}
      $('#draftNote').textContent = 'Draft saved in this browser.';
    }, 600);
  });

  /* ---------- wrestlers ---------- */
  function renderChips() {
    $('#wrestlerChips').innerHTML = chosen.map((id) => {
      const w = catalog.wrestlers.find((x) => x.id === id);
      return `<li><span class="chip">${esc(w ? w.name : id)} <button type="button" data-drop="${esc(id)}" aria-label="Remove ${esc(w ? w.name : id)}">×</button></span></li>`;
    }).join('');
  }
  $('#wrestlerChips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-drop]');
    if (!b) return;
    chosen = chosen.filter((x) => x !== b.dataset.drop);
    renderChips(); form.dispatchEvent(new Event('input'));
  });
  $('#wrestlerInput').addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const v = e.target.value.trim();
    if (!v) return;
    const w = catalog.wrestlers.find((x) => x.name.toLowerCase() === v.toLowerCase() || x.id === v.toLowerCase());
    if (w) {
      if (!chosen.includes(w.id)) chosen.push(w.id);
      e.target.value = ''; renderChips(); form.dispatchEvent(new Event('input'));
    } else {
      const dlg = $('#addWrestler');
      $('#addWrestlerForm').elements.name.value = v;
      $('#addWrestlerMsg').textContent = '';
      $$('#addWrestlerForm input[type=checkbox]').forEach((c) => { c.checked = c.value === form.elements.era.value || c.value === form.elements.promotion.value; });
      dlg.showModal();
    }
  });
  $('#addWrestlerForm').addEventListener('submit', async (e) => {
    if (e.submitter?.value !== 'add') return;
    e.preventDefault();
    const f = e.target;
    $('#addWrestlerMsg').textContent = 'Adding…';
    const r = await api('wrestler', { method: 'POST', body: JSON.stringify({
      name: f.elements.name.value, eras: $$('input[name=era]:checked', f).map((c) => c.value), promotions: $$('input[name=promo]:checked', f).map((c) => c.value),
    }) });
    if (!r.ok) { $('#addWrestlerMsg').textContent = r.error || 'Could not add'; return; }
    const w = { id: r.id, name: f.elements.name.value.trim(), eras: [] };
    if (!catalog.wrestlers.some((x) => x.id === w.id)) { catalog.wrestlers.push(w); remember('wrestlers', w); }
    if (!chosen.includes(w.id)) chosen.push(w.id);
    $('#wrestlerInput').value = '';
    $('#addWrestler').close();
    renderChips(); form.dispatchEvent(new Event('input'));
  });

  /* ---------- rating control ---------- */
  function renderRating() {
    $$('[data-my]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.my === my.mode)));
    $('#myRange').disabled = my.mode !== 'stars';
    $('#myRange').value = String(my.value);
    $('#negField').hidden = my.mode !== 'negative';
    if (my.mode === 'negative') $('#negValue').value = String(my.value || 1);
    const r = my.mode === 'none' ? null : my.mode === 'dud' ? 'dud' : my.mode === 'negative' ? -Math.abs(Number($('#negValue').value)) : my.value;
    $('#myOut').textContent = my.mode === 'stars' ? `${my.value} / 5` : '';
    $('#myPreview').innerHTML = stars(r);
  }
  $$('[data-my]').forEach((b) => b.addEventListener('click', () => {
    my.mode = b.dataset.my;
    if (my.mode === 'stars' && !my.value) my.value = 3;
    renderRating(); form.dispatchEvent(new Event('input'));
  }));
  $('#myRange').addEventListener('input', (e) => { my.value = Number(e.target.value); renderRating(); });
  $('#negValue').addEventListener('input', (e) => { my.value = Number(e.target.value); renderRating(); });

  /* ---------- previews ---------- */
  function ytId(s) {
    s = s.trim();
    if (/^[\w-]{11}$/.test(s)) return s;
    const m = s.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function renderYt() {
    const v = form.elements.youtube.value, id = ytId(v), box = $('#ytPreview');
    box.hidden = !v.trim();
    box.innerHTML = id ? `<img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" width="240" height="135" /><span>Video ID <code>${id}</code></span>` : '<span class="desk-msg warn">That doesn\'t look like a YouTube link.</span>';
  }
  function inline(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  }
  function renderPreview() {
    const text = form.elements.body.value.trim();
    $('#reviewPreview').innerHTML = text ? text.split(/\n\s*\n/).map((p) => `<p>${inline(p).replace(/\n/g, '<br />')}</p>`).join('') : '<p class="muted">Your review will appear here.</p>';
    const words = text ? text.split(/\s+/).length : 0;
    $('#wordCount').textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  }

  /* ---------- publish ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#saveMsg'), btn = $('#publishBtn');
    btn.disabled = true; msg.className = 'desk-msg'; msg.textContent = 'Publishing…';
    const data = collect();
    const r = await api('match', { method: 'PUT', body: JSON.stringify({ id: current, create: !current, data, body: form.elements.body.value }) });
    btn.disabled = false;
    if (r.status === 401) { msg.textContent = 'Your session ended. Sign in again; your draft is safe in this browser.'; app.hidden = true; login.hidden = false; return; }
    if (!r.ok) {
      msg.className = 'desk-msg warn';
      msg.innerHTML = `${esc(r.error || 'Publishing failed')}${r.errors ? `<ul>${r.errors.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`;
      return;
    }
    try { localStorage.removeItem(draftKey()); } catch {}
    const entry = { id: r.id, data, body: form.elements.body.value.trim(), at: Date.now() };
    const i = catalog.matches.findIndex((x) => x.id === r.id);
    if (i === -1) catalog.matches.unshift(entry); else catalog.matches[i] = entry;
    remember('matches', entry);
    current = r.id;
    $('#formMode').textContent = `Editing · ${r.id}`;
    $('#draftNote').textContent = '';
    msg.className = 'desk-msg ok';
    msg.innerHTML = r.unchanged ? 'No changes to publish.' :
      `✅ Published. The site rebuilds in about a minute: <a href="${esc(r.pageUrl)}" target="_blank" rel="noopener">view the page</a> · <a href="${esc(r.commitUrl)}" target="_blank" rel="noopener">commit</a>`;
    renderList(); loadLog();
  });

  boot();
})();
