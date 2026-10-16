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
    .nt-time{ font-size: 12px; color: #86868b; margin-top: 3px; }
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

  let items = [], unread = 0;
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
    const what = el('div', 'nt-what'), actor = el('b', null, n.actor || 'Someone'), title = el('b', null, '“' + (n.idea_title || 'a deleted idea') + '”');
    const t = s => document.createTextNode(s);
    if (n.type === 'vote') what.append(actor, t(' upvoted your idea '), title);
    else if (n.type === 'comment') what.append(actor, t(' commented on your idea '), title);
    else if (n.type === 'reply') what.append(actor, t(' also commented on '), title);
    else if (n.type === 'status') what.append(t('Your idea '), title, t(' is now '), el('b', null, STATUS[n.detail] || n.detail));
    else if (n.type === 'idea') what.append(actor, t(' shared a new idea '), title);
    else if (n.type === 'announce') what.append(t('New tool: '), el('b', null, n.ann_title || 'a tool'));
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
    const list = el('div', 'nt-list');
    if (!items.length) list.appendChild(el('div', 'nt-empty', 'Nothing yet. You hear here about new tools, and when people vote on or reply to your ideas.'));
    items.forEach(n => {
      const it = el('button', 'nt-item' + (n.read ? '' : ' unread')); it.type = 'button';
      it.appendChild(line(n));
      if ((n.type === 'comment' || n.type === 'reply') && n.detail) it.appendChild(el('div', 'nt-snip', n.detail));
      if (n.type === 'announce' && n.ann_body) it.appendChild(el('div', 'nt-snip', n.ann_body));
      it.appendChild(el('div', 'nt-time', ago(n.created_at)));
      it.addEventListener('click', async () => {
        if (!n.read) { await post({ id: n.id }); n.read = true; unread = Math.max(0, unread - 1); }
        close();
        if (n.type === 'announce') { location.href = n.ann_link || '/'; return; }
        if (n.type === 'milestone') { location.href = '/#time-saved'; return; }
        const target = '/ideas/#idea-' + n.idea_id;
        if (location.pathname === '/ideas/' || location.pathname === '/ideas') { location.hash = 'idea-' + n.idea_id; paint(); }
        else location.href = target;
      });
      list.appendChild(it);
    });
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
      items = j.items; unread = j.unread; wrap.hidden = false;
      if (panel.hidden) paint();
    } catch (e) { wrap.hidden = true; }
  }
  function open() { paint(); panel.hidden = false; btn.setAttribute('aria-expanded', 'true'); }
  function close() { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); }

  btn.addEventListener('click', () => panel.hidden ? open() : close());
  document.addEventListener('click', e => { if (!wrap.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); } });
  // check again every minute while the page is open, and when you come back to it
  setInterval(() => { if (document.visibilityState === 'visible') load(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') load(); });
  load();
})();
