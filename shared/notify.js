// Notification bell for the Toolbox (launcher and Ideas page).
// Put <span id="notify"></span> where the bell should go and load this script.
// Only works when served by the Toolbox server; elsewhere the bell stays hidden.
(function () {
  const host = document.getElementById('notify');
  if (!host) return;

  const STATUS = { 'new': 'New', 'planned': 'Planned', 'in-progress': 'In progress', 'done': 'Done', 'declined': 'Declined' };
  const css = `
    .nt{ position: relative; z-index: 40; display: inline-flex; }
    .nt-btn{ position: relative; width: 38px; height: 38px; border-radius: 9999px; background: transparent; border: 1px solid rgba(255,255,255,0.16);
      color: #fff; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: transform .1s ease, border-color .15s ease; }
    .nt-btn:hover{ border-color: #86868b; }
    .nt-btn:active{ transform: scale(0.95); }
    .nt-btn:focus-visible{ outline: 2px solid #0071e3; outline-offset: 3px; }
    .nt-btn svg{ width: 17px; height: 17px; stroke: currentColor; fill: none; }
    .nt-badge{ position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9999px;
      background: #ff453a; color: #fff; font: 600 11px/18px 'Inter', -apple-system, system-ui, sans-serif; text-align: center; }
    .nt-panel{ position: absolute; top: calc(100% + 8px); right: 0; z-index: 50; width: 360px; max-width: calc(100vw - 32px);
      background: #2a2a2c; border: 1px solid rgba(255,255,255,0.16); border-radius: 18px; padding: 8px;
      font-family: 'Inter', -apple-system, system-ui, sans-serif; color: #fff; text-align: left; }
    .nt-head{ display: flex; align-items: center; justify-content: space-between; padding: 8px 10px 10px; }
    .nt-head b{ font-size: 14px; font-weight: 600; }
    .nt-all{ background: none; border: none; color: #2997ff; font: 400 13px 'Inter', -apple-system, system-ui, sans-serif; cursor: pointer; padding: 0; }
    .nt-list{ max-height: 420px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
    .nt-item{ display: block; width: 100%; text-align: left; background: none; border: none; border-radius: 12px; padding: 10px 10px 10px 22px;
      color: #fff; cursor: pointer; position: relative; font-family: inherit; }
    .nt-item:hover, .nt-item:focus-visible{ background: rgba(255,255,255,0.06); outline: none; }
    .nt-item.unread::before{ content: ''; position: absolute; left: 8px; top: 16px; width: 7px; height: 7px; border-radius: 9999px; background: #2997ff; }
    .nt-what{ font-size: 13.5px; line-height: 1.4; color: #cccccc; }
    .nt-what b{ color: #fff; font-weight: 600; }
    .nt-snip{ font-size: 13px; line-height: 1.4; color: #86868b; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .nt-msg{ font-size: 13px; line-height: 1.45; color: #b5b5b5; margin-top: 4px; white-space: pre-wrap; overflow-wrap: anywhere;
      display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
    .nt-time{ font-size: 12px; color: #86868b; margin-top: 3px; }
    .nt-tabs{ display: flex; gap: 2px; padding: 3px; margin: 0 6px 6px; border-radius: 9999px; background: #0a0a0a; border: 1px solid rgba(255,255,255,0.12); }
    .nt-tabs button{ flex: 1; height: 28px; border: none; background: none; border-radius: 9999px; color: #7b7b7b; font: 600 12px inherit; font-family: inherit; cursor: pointer; }
    .nt-tabs button:hover{ color: #a6a6a6; }
    .nt-tabs button.on{ background: #232323; color: #fff; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.12); }
    .nt-tabs .n{ margin-left: 5px; color: #f87171; }
    .nt-item.read .nt-what{ color: #9a9a9a; }
    .nt-item.read .nt-what b{ color: #d0d0d0; }
    .nt-more{ display: block; width: calc(100% - 12px); margin: 6px; height: 34px; border-radius: 9999px; background: transparent; border: 1px solid rgba(255,255,255,0.14);
      color: #a6a6a6; font: 600 12.5px inherit; font-family: inherit; cursor: pointer; }
    .nt-more:hover{ color: #fff; border-color: rgba(255,255,255,0.3); }
    .nt-more:disabled{ opacity: .5; cursor: default; }
    .nt-empty{ font-size: 13px; color: #86868b; padding: 16px 10px 18px; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  // shown straight away (no jump when the count arrives); hidden again only if the server does not answer
  const wrap = el('span', 'nt'); wrap.hidden = location.protocol === 'file:';
  const btn = el('button', 'nt-btn'); btn.type = 'button'; btn.setAttribute('aria-haspopup', 'true'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const badge = el('span', 'nt-badge'); badge.hidden = true; btn.appendChild(badge);
  const panel = el('div', 'nt-panel'); panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Notifications');
  wrap.appendChild(btn); wrap.appendChild(panel); host.appendChild(wrap);

  let items = [], unread = 0, more = false, view = 'unread';   // view: unread or read
  function ago(t) {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    if (m < 60 * 24) return Math.round(m / 60) + ' h ago';
    if (m < 60 * 24 * 7) return Math.round(m / 1440) + ' d ago';
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  // one line of text per notification; names and titles always as text, never as HTML
  function line(n) {
    const what = el('div', 'nt-what'), actor = el('b', null, n.actor || 'Someone'), title = el('b', null, '“' + (n.idea_title || 'a deleted suggestion') + '”');
    const t = s => document.createTextNode(s);
    if (n.type === 'vote') what.append(actor, t(' upvoted your suggestion '), title);
    else if (n.type === 'comment' || n.type === 'reply') what.append(actor, t(' replied on '), title);
    else if (n.type === 'status') what.append(t('Your suggestion '), title, t(' is now '), el('b', null, STATUS[n.detail] || n.detail));
    else if (n.type === 'idea') what.append(actor, t(' suggested '), title);
    else if (n.type === 'announce' && n.ann_kind === 'update') what.append(el('b', null, n.ann_title || 'Update'));
    else if (n.type === 'announce') what.append(t('New tool: '), el('b', null, n.ann_title || 'a tool'));
    else if (n.type === 'request') what.append(actor, t(' requested access to the Creative Toolbox'));
    else if (n.type === 'milestone') what.append(t('Milestone: the team saved '), el('b', null, n.detail + 'h'), t(' with the Creative Toolbox'));
    return what;
  }

  function paint() {
    badge.hidden = !unread; badge.textContent = unread > 9 ? '9+' : String(unread);
    btn.setAttribute('aria-label', 'Notifications' + (unread ? ' (' + unread + ' unread)' : ''));
    panel.innerHTML = '';
    const head = el('div', 'nt-head'); head.appendChild(el('b', null, 'Notifications'));
    if (unread) {
      const all = el('button', 'nt-all', 'Mark all as read'); all.type = 'button';
      all.addEventListener('click', async () => { await post({}); items.forEach(n => n.read = true); unread = 0; paint(); });
      head.appendChild(all);
    }
    panel.appendChild(head);
    // Unread / Read
    const tabs = el('div', 'nt-tabs'); tabs.setAttribute('role', 'tablist');
    [['unread', 'Unread'], ['read', 'Read']].forEach(([k, label]) => {
      const b = el('button', view === k ? 'on' : '', label); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', view === k);
      if (k === 'unread' && unread) b.appendChild(el('span', 'n', String(unread)));
      b.addEventListener('click', e => { e.stopPropagation(); if (view !== k) { view = k; paint(); } });
      tabs.appendChild(b);
    });
    panel.appendChild(tabs);
    const list = el('div', 'nt-list');
    // the unread ones, or everything you already read (back to a year ago, 30 at a time)
    const shown = items.filter(n => view === 'unread' ? !n.read : n.read);
    if (!shown.length) list.appendChild(el('div', 'nt-empty', !items.length ? 'Nothing yet. You hear here about new tools, updates, and replies to your suggestions.'
      : view === 'unread' ? 'You are all caught up. Earlier notifications are under Read.' : 'Nothing read yet.'));
    shown.forEach(n => {
      const it = el('button', 'nt-item' + (n.read ? ' read' : ' unread')); it.type = 'button';
      it.appendChild(line(n));
      if ((n.type === 'comment' || n.type === 'reply' || n.type === 'request') && n.detail) it.appendChild(el('div', 'nt-snip', n.detail));
      if (n.type === 'announce' && n.ann_body) it.appendChild(el('div', n.ann_kind === 'update' ? 'nt-msg' : 'nt-snip', n.ann_body));
      it.appendChild(el('div', 'nt-time', ago(n.created_at)));
      it.addEventListener('click', async () => {
        if (!n.read) { await post({ id: n.id }); n.read = true; unread = Math.max(0, unread - 1); }
        close();
        if (n.type === 'announce') { if (n.ann_kind !== 'update' || (n.ann_link && n.ann_link !== '/')) location.href = n.ann_link || '/'; else paint(); return; }
        if (n.type === 'milestone') { location.href = '/#time-saved'; return; }
        if (n.type === 'request') { location.href = '/admin#requests'; return; }
        // the admin reads suggestions on the admin page, everyone else on My suggestions
        if (document.body.dataset.tbAdmin === '1') { location.href = '/admin#idea-' + n.idea_id; return; }
        const target = '/ideas/#idea-' + n.idea_id;
        if (location.pathname === '/ideas/' || location.pathname === '/ideas') { location.hash = 'idea-' + n.idea_id; paint(); }
        else location.href = target;
      });
      list.appendChild(it);
    });
    if (more && view === 'read') {
      const older = el('button', 'nt-more', 'Show older'); older.type = 'button';
      older.addEventListener('click', async () => {
        older.disabled = true; older.textContent = 'Loading…';
        try {
          const last = items[items.length - 1];
          const r = await fetch('/api/notifications?before=' + (last ? last.created_at : 0));
          const j = await r.json();
          items = items.concat(j.items.filter(n => !items.some(x => x.id === n.id))); more = j.more;
          const top = list.scrollTop; paint(); panel.querySelector('.nt-list').scrollTop = top;
        } catch (e) { older.disabled = false; older.textContent = 'Show older'; }
      });
      list.appendChild(older);
    }
    panel.appendChild(list);
  }

  async function post(body) {
    try { await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (e) { }
  }
  async function load() {
    try {
      const r = await fetch('/api/notifications');
      if (!r.ok) { wrap.hidden = true; return; }
      const j = await r.json();
      // keep older ones you loaded with "Show older"
      const oldest = j.items.length ? j.items[j.items.length - 1].created_at : Infinity;
      const kept = items.filter(n => n.created_at < oldest && !j.items.some(x => x.id === n.id));
      items = j.items.concat(kept); unread = j.unread; if (!kept.length) more = j.more; wrap.hidden = false;
      if (panel.hidden) paint();
    } catch (e) { wrap.hidden = true; }
  }
  function open() { view = unread ? 'unread' : 'read'; paint(); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
  function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', () => panel.hidden ? open() : close());
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });
  // check again every minute while the page is open, and when you come back to it
  setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
  load();
})();
