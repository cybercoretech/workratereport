/* /account/: sign-in screen or profile editor (uses window.WRMember from member.js). */
(() => {
  const $ = (s) => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const ret = params.get('return');
  if (ret && /^\/(?!\/)/.test(ret)) $('#googleBtn').href = `/api/auth/google?return=${encodeURIComponent(ret)}`;
  window.WRMember.ready.then(async (me) => {
    if (!me) {
      $('#signedOut').hidden = false;
      const r = await WRMember.json('/api/me');
      if (!r.google) { $('#googleBtn').hidden = true; $('#googleOff').hidden = false; }
      return;
    }
    $('#signedIn').hidden = false;
    if (params.get('welcome')) $('#welcome').hidden = false;
    const f = $('#profileForm');
    const fill = (m) => {
      for (const k of ['handle', 'display_name', 'bio', 'favorite_era', 'favorite_promotion', 'favorite_wrestler']) f.elements[k].value = m[k] ?? '';
      f.elements.watching_since.value = m.watching_since ?? '';
      [...f.querySelectorAll('input[name=avatar]')].forEach((r) => { r.checked = `preset:${r.value}` === m.avatar; });
      [...f.querySelectorAll('input[name=visibility]')].forEach((r) => { r.checked = r.value === (m.visibility || 'public'); });
      $('#acctName').textContent = m.display_name;
      $('#viewProfile').href = `/u/${encodeURIComponent(m.handle)}/`;
    };
    fill(me);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const msg = $('#profileMsg');
      msg.className = 'desk-msg'; msg.textContent = 'Saving…';
      const body = {
        handle: f.elements.handle.value, display_name: f.elements.display_name.value, bio: f.elements.bio.value,
        favorite_era: f.elements.favorite_era.value, favorite_promotion: f.elements.favorite_promotion.value, favorite_wrestler: f.elements.favorite_wrestler.value,
        watching_since: f.elements.watching_since.value, avatar: f.querySelector('input[name=avatar]:checked')?.value,
        visibility: f.querySelector('input[name=visibility]:checked')?.value,
      };
      const r = await WRMember.json('/api/me', { method: 'PATCH', body: JSON.stringify(body) });
      if (!r.ok) { msg.className = 'desk-msg warn'; msg.innerHTML = `${WRMember.esc(r.error || 'Could not save')}${r.errors ? `<ul>${r.errors.map((x) => `<li>${WRMember.esc(x)}</li>`).join('')}</ul>` : ''}`; return; }
      fill({ ...r.member });
      msg.className = 'desk-msg ok'; msg.textContent = 'Saved.';
      const slot = document.querySelector('[data-account] .account-btn');
      if (slot) slot.innerHTML = `<img src="${WRMember.avatar(r.member.avatar)}" alt="" width="30" height="30" /><span>${WRMember.esc(r.member.display_name)}</span>`;
      $('#welcome').hidden = true;
    });
    $('#signOut').addEventListener('click', async () => {
      await WRMember.json('/api/auth/logout', { method: 'POST', body: '{}' });
      location.href = '/';
    });
  });
})();
