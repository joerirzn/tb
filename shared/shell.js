// The Creative Toolbox app shell: the same sidebar on every page, with search (⌘K), the tools, your
// favourites and your profile. Load it as the first thing in <body> (not deferred), with shared/shell.css
// in <head>, so the sidebar is there before the page is drawn.
// The Toolbox server puts who is signed in on <body> (data-tb-name, -job, -email, -admin; see worker/index.js).
// Pages can use window.tbShell: favourites, the signed-in person and a change listener.
(function () {
  const script = document.currentScript;
  const ROOT = new URL('../', script.src).href;            // the launcher, e.g. https://tb…/ or file:///…/Toolbox/
  const served = location.protocol !== 'file:';
  const page = p => ROOT + p + (served || !p || p.endsWith('.html') || p.startsWith('#') ? '' : 'index.html');   // file previews need index.html
  const here = location.href.split(/[?#]/)[0].replace(/index\.html$/, '');

  // the tools, in launcher order. A tool still being built gets admin: true (only the admin sees it).
  const TOOLS = [
    { path: 'banner-generator/', name: 'Social Banner Creator', img: 'banner-generator/thumbnail.jpg' },
    { path: 'cover-converter/', name: 'Cover Converter', img: 'cover-converter/thumbnail.jpg' },
    { path: 'sessions-radio-maker/', name: 'Sessions Asset Generator', img: 'sessions-radio-maker/thumbnail.jpg' },
    { path: 'thumbnail-maker/', name: 'Thumbnail Maker', img: 'thumbnail-maker/thumbnail.jpg' },
    { path: 'song-briefing/', name: 'Song Briefing', img: 'song-briefing/thumbnail.jpg' },
    { path: 'general-briefing/', name: 'General Briefing' },   // its thumbnail is still to come
  ];

  const I = {
    home: '<path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>',
    idea: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.1 2.2h5c0-.9.5-1.7 1.1-2.2A6 6 0 0 0 12 3z"/>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    out: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4"/>',
    updown: '<path d="M8 9l4-4 4 4M8 15l4 4 4-4"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    chev: '<path d="M15 18l-6-6 6-6"/>',
    burger: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    page: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  };
  const svg = k => '<svg class="tb-i" viewBox="0 0 24 24" aria-hidden="true">' + I[k] + '</svg>';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- who is signed in ----------
  const b = document.body.dataset, dec = s => { try { return decodeURIComponent(s || ''); } catch (e) { return s || ''; } };
  let user = served
    ? { name: dec(b.tbName), jobTitle: dec(b.tbJob), email: dec(b.tbEmail), isAdmin: b.tbAdmin === '1' }
    : { name: 'Joeri Roozen', jobTitle: 'Designer', email: 'preview', isAdmin: true };   // a file opened on its own: design preview
  const initials = n => n.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '·';

  // ---------- favourites (kept in this browser) ----------
  const FAV_KEY = 'toolbox.favourites';
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]'); } catch (e) { }
  const listeners = [];
  const tools = () => TOOLS.filter(t => !t.admin || user.isAdmin);

  // ---------- the small sidebar is remembered ----------
  const MINI_KEY = 'toolbox.sidebar';
  try { if (localStorage.getItem(MINI_KEY) === 'mini') document.documentElement.classList.add('tb-mini'); } catch (e) { }

  // ---------- build ----------
  const nav = document.createElement('aside');
  nav.className = 'tb-nav'; nav.id = 'tbNav'; nav.setAttribute('aria-label', 'Navigation');
  nav.innerHTML =
    '<div class="tb-head">' +
      '<a class="tb-brand" href="' + page('') + '" data-tip="Creative Toolbox"><img src="' + ROOT + 'favicon.png?v=2" alt=""><span>Creative Toolbox</span></a>' +
    '</div>' +
    '<button class="tb-edge" type="button" id="tbCollapse" aria-label="Make the sidebar smaller">' + svg('chev') + '</button>' +
    '<div class="tb-searchrow">' +
      '<button class="tb-search" type="button" id="tbSearch" data-tip="Search">' + svg('search') + '<span class="tb-t">Search…</span><kbd>⌘K</kbd></button>' +
      '<span id="notify"></span>' +
    '</div>' +
    '<div class="tb-scroll">' +
      '<div class="tb-label">Main</div>' +
      '<nav class="tb-links" aria-label="Main">' +
        '<a href="' + page('') + '#home" data-key="home" data-tip="Home">' + svg('home') + '<span class="tb-t">Home</span></a>' +
        '<a href="' + page('') + '#time-saved" data-key="time" data-tip="Time saved">' + svg('clock') + '<span class="tb-t">Time saved</span></a>' +
        '<a href="' + page('ideas/') + '" data-key="ideas" data-tip="Ideas">' + svg('idea') + '<span class="tb-t">Ideas</span><span class="tb-badge" id="tbIdeas" hidden></span></a>' +
      '</nav>' +
      '<a class="tb-create" href="' + page('ideas/') + '#new" data-tip="Suggest a tool">' + svg('plus') + '<span class="tb-t">Suggest a tool</span></a>' +
      '<div class="tb-group" id="tbFavGroup" hidden><div class="tb-label">Favourites</div><nav class="tb-links" id="tbFavs" aria-label="Favourite tools"></nav></div>' +
      '<div class="tb-group" id="tbToolGroup"><div class="tb-label" id="tbToolsLabel">Tools</div><nav class="tb-links" id="tbTools" aria-label="Tools"></nav></div>' +
    '</div>' +
    '<div class="tb-me">' +
      '<div class="tb-menu" id="tbMenu" hidden>' +
        '<a href="/admin" id="tbAdmin" hidden>' + svg('shield') + 'Access</a>' +
        '<a href="/account">' + svg('user') + 'Account and password</a>' +
        '<button type="button" id="tbSignOut">' + svg('out') + 'Sign out</button>' +
      '</div>' +
      '<button class="tb-me-btn" type="button" id="tbMe" aria-haspopup="true" aria-expanded="false">' +
        '<span class="tb-avatar"><span id="tbInitials"></span></span>' +
        '<span class="tb-me-txt"><b id="tbName"></b><span id="tbJob"></span></span>' + svg('updown') +
      '</button>' +
    '</div>';

  const top = document.createElement('div');
  top.className = 'tb-top';
  top.innerHTML = '<button type="button" id="tbBurger" aria-label="Menu">' + svg('burger') + '</button><a href="' + page('') + '"><img src="' + ROOT + 'favicon.png?v=2" alt="">Creative Toolbox</a>';
  const shade = document.createElement('div'); shade.className = 'tb-shade';
  const tip = document.createElement('div'); tip.className = 'tb-tip'; tip.hidden = true;
  document.body.prepend(nav, top, shade, tip);
  const $ = id => document.getElementById(id);

  // ---------- fill in ----------
  function showUser() {
    $('tbName').textContent = user.name || user.email || '';
    $('tbJob').textContent = user.jobTitle || (user.name ? user.email : '') || '';
    $('tbInitials').textContent = initials(user.name || user.email || '');
    $('tbAdmin').hidden = !user.isAdmin;
    nav.querySelector('.tb-me').hidden = !(user.name || user.email);
  }

  function link(t) {
    const a = document.createElement('a');
    a.href = page(t.path); a.dataset.tip = t.name;
    if (here === ROOT + t.path) { a.classList.add('tb-on'); a.setAttribute('aria-current', 'page'); }
    a.innerHTML = (t.img ? '<img class="tb-thumb" src="' + ROOT + t.img + '" alt="">' : (t.admin ? svg('lock') : svg('page'))) + '<span class="tb-t">' + esc(t.name) + '</span>';
    return a;
  }
  function renderTools() {
    const list = tools(), mine = list.filter(t => favs.includes('/' + t.path)), rest = list.filter(t => !favs.includes('/' + t.path));
    $('tbFavs').replaceChildren(...mine.map(link));
    $('tbTools').replaceChildren(...rest.map(link));
    $('tbFavGroup').hidden = !mine.length;
    $('tbToolGroup').hidden = !rest.length;
    $('tbToolsLabel').textContent = mine.length ? 'Other tools' : 'Tools';
  }

  // which page we are on: Home and Time saved are two views of the launcher
  function markMain() {
    const launcher = here === ROOT, key = launcher ? (location.hash === '#time-saved' ? 'time' : 'home') : here === ROOT + 'ideas/' ? 'ideas' : '';
    nav.querySelectorAll('.tb-links a[data-key]').forEach(a => { a.classList.toggle('tb-on', a.dataset.key === key); if (a.dataset.key === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    glide();
  }
  // the highlight behind the page you are on, which glides when you switch between Home and Time saved
  const mainLinks = nav.querySelector('.tb-links');
  const glider = document.createElement('span'); glider.className = 'tb-glide'; glider.setAttribute('aria-hidden', 'true');
  mainLinks.prepend(glider); mainLinks.classList.add('tb-has-glide');
  function glide() {
    const on = mainLinks.querySelector('a.tb-on');
    glider.classList.toggle('tb-show', !!on);
    if (!on) return;
    const moved = glider.style.height !== '';
    if (!moved) glider.style.transition = 'none';
    glider.style.transform = 'translateY(' + on.offsetTop + 'px)'; glider.style.height = on.offsetHeight + 'px';
    if (!moved) { void glider.offsetWidth; glider.style.transition = ''; }
  }
  showUser(); renderTools(); markMain();
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add('tb-ready')));
  if (document.fonts) document.fonts.ready.then(glide);
  addEventListener('hashchange', () => { markMain(); document.documentElement.classList.remove('tb-open'); });
  // the launcher switches views itself; elsewhere a link back to it simply navigates
  nav.querySelectorAll('.tb-links a[data-key="home"], .tb-links a[data-key="time"]').forEach(a => a.addEventListener('click', e => {
    if (here !== ROOT) return;
    e.preventDefault(); history.pushState(null, '', a.dataset.key === 'time' ? '#time-saved' : '#home'); dispatchEvent(new HashChangeEvent('hashchange'));
  }));

  // online: the full details (name changes etc.), new ideas, and the bell
  if (served) {
    if (!user.name && !user.email) fetch('/auth/me').then(r => r.ok ? r.json() : null).then(me => { if (me) { user = me; showUser(); renderTools(); } }).catch(() => { });
    fetch('/api/ideas').then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      const fresh = d.ideas.filter(i => i.status === 'new').length;
      if (fresh) { $('tbIdeas').textContent = fresh; $('tbIdeas').hidden = false; }
    }).catch(() => { });
    const s = document.createElement('script'); s.src = ROOT + 'shared/notify.js'; s.defer = true; document.head.appendChild(s);
  } else {
    $('tbIdeas').textContent = '2'; $('tbIdeas').hidden = false;
    $('notify').innerHTML = '<span class="tb-ic" title="Notifications (preview)">' + svg('bell') + '<span class="tb-dot"></span></span>';
  }

  // ---------- profile menu ----------
  const menu = $('tbMenu'), meBtn = $('tbMe');
  meBtn.addEventListener('click', () => { menu.hidden = !menu.hidden; meBtn.setAttribute('aria-expanded', !menu.hidden); });
  document.addEventListener('click', e => { if (!nav.querySelector('.tb-me').contains(e.target)) { menu.hidden = true; meBtn.setAttribute('aria-expanded', 'false'); } });
  $('tbSignOut').addEventListener('click', async () => { try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) { } location.href = '/login'; });

  // ---------- small sidebar, and the phone menu ----------
  // the contents fade out, the sidebar slides to its new width, the contents fade back in
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  $('tbCollapse').addEventListener('click', () => {
    const root = document.documentElement, mini = !root.classList.contains('tb-mini');
    $('tbCollapse').setAttribute('aria-label', mini ? 'Make the sidebar wider' : 'Make the sidebar smaller');
    try { localStorage.setItem(MINI_KEY, mini ? 'mini' : 'wide'); } catch (e) { }
    tip.hidden = true;
    const swap = () => {
      root.classList.toggle('tb-mini', mini); glide();
      setTimeout(() => { glide(); dispatchEvent(new Event('resize')); }, 320);   // tools with a canvas fit themselves to the new width
    };
    if (reduceMotion) { swap(); return; }
    root.classList.remove('tb-swap'); void root.offsetWidth; root.classList.add('tb-swap');
    setTimeout(swap, 90);
    setTimeout(() => root.classList.remove('tb-swap'), 320);
  });
  if (document.documentElement.classList.contains('tb-mini')) $('tbCollapse').setAttribute('aria-label', 'Make the sidebar wider');
  $('tbBurger').addEventListener('click', () => document.documentElement.classList.add('tb-open'));
  shade.addEventListener('click', () => document.documentElement.classList.remove('tb-open'));
  // names next to the icons when the sidebar is small
  nav.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t || !document.documentElement.classList.contains('tb-mini')) { tip.hidden = true; return; }
    const r = t.getBoundingClientRect();
    tip.textContent = t.dataset.tip; tip.hidden = false;
    tip.style.left = (r.right + 10) + 'px'; tip.style.top = (r.top + r.height / 2 - 13) + 'px';
  });
  nav.addEventListener('mouseleave', () => { tip.hidden = true; });

  // ---------- ⌘K search ----------
  const pal = document.createElement('div');
  pal.className = 'tb-palette'; pal.hidden = true;
  pal.setAttribute('role', 'dialog'); pal.setAttribute('aria-modal', 'true'); pal.setAttribute('aria-label', 'Search');
  pal.innerHTML = '<div class="tb-palette-box"><div class="tb-palette-in">' + svg('search') +
    '<input class="tb-pq" type="search" placeholder="Search tools and pages…" autocomplete="off" spellcheck="false" aria-label="Search" aria-controls="tbPl"></div><ul id="tbPl" role="listbox"></ul></div>';
  document.body.appendChild(pal);
  const pq = pal.querySelector('input'), pl = pal.querySelector('ul');
  let results = [], sel = 0;
  function entries() {
    const list = tools().map(t => ({ label: t.name, kind: 'Tool', href: page(t.path), img: t.img ? ROOT + t.img : null, icon: I.page, fav: favs.includes('/' + t.path) }));
    list.sort((a, b) => b.fav - a.fav);
    list.push({ label: 'Home', kind: 'Page', href: page('') + '#home', icon: I.home });
    list.push({ label: 'Time saved', kind: 'Page', href: page('') + '#time-saved', icon: I.clock });
    list.push({ label: 'Ideas', kind: 'Page', href: page('ideas/'), icon: I.idea });
    list.push({ label: 'Suggest a tool', kind: 'Ideas', href: page('ideas/') + '#new', icon: I.plus });
    list.push({ label: 'Account and password', kind: 'Page', href: '/account', icon: I.user });
    if (user.isAdmin) list.push({ label: 'Access requests', kind: 'Admin', href: '/admin', icon: I.shield });
    return list;
  }
  function score(label, q) {   // part of the name ("sess"), or the first letters of its words ("sbc")
    if (!q) return 1;
    const s = label.toLowerCase(), t = q.toLowerCase(), at = s.indexOf(t);
    if (at === 0) return 100;
    if (at > 0) return (s[at - 1] === ' ' ? 80 : 50) - at;
    const ini = s.split(/[\s:'’-]+/).filter(Boolean).map(w => w[0]).join('');
    return ini.startsWith(t) ? 40 : 0;
  }
  function go(href) {
    closePalette();
    const u = new URL(href, location.href);
    if (u.href.split('#')[0] === location.href.split('#')[0] && u.hash) { history.pushState(null, '', u.hash); dispatchEvent(new HashChangeEvent('hashchange')); }
    else location.href = href;
  }
  function draw() {
    const q = pq.value.trim();
    results = entries().map(e => ({ e, s: score(e.label, q) })).filter(x => x.s > 0).sort((a, b) => q ? b.s - a.s : 0).map(x => x.e);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    pl.innerHTML = '';
    if (!results.length) { const li = document.createElement('li'); li.className = 'tb-none'; li.textContent = 'Nothing found for "' + q + '"'; pl.appendChild(li); return; }
    results.forEach((e, i) => {
      const li = document.createElement('li'); li.setAttribute('role', 'option'); li.setAttribute('aria-selected', i === sel); li.className = i === sel ? 'tb-sel' : '';
      const ic = document.createElement('span'); ic.className = 'tb-pi';
      if (e.img) { const im = document.createElement('img'); im.src = e.img; im.alt = ''; ic.appendChild(im); } else ic.innerHTML = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">' + e.icon + '</svg>';
      const t = document.createElement('span'); t.textContent = e.label + (e.fav ? '  ★' : '');
      const k = document.createElement('span'); k.className = 'tb-k'; k.textContent = i === sel ? 'Enter ↵' : e.kind;
      li.append(ic, t, k);
      li.addEventListener('mousemove', () => { if (sel !== i) { sel = i; draw(); } });
      li.addEventListener('click', () => go(e.href));
      pl.appendChild(li);
    });
    const s = pl.querySelector('.tb-sel'); if (s) s.scrollIntoView({ block: 'nearest' });
  }
  let before = null;
  function openPalette() { before = document.activeElement; pal.hidden = false; pq.value = ''; sel = 0; draw(); pq.focus(); document.documentElement.classList.remove('tb-open'); }
  function closePalette() { if (pal.hidden) return; pal.hidden = true; if (before && before.focus) before.focus(); }
  $('tbSearch').addEventListener('click', openPalette);
  pal.addEventListener('click', e => { if (e.target === pal) closePalette(); });
  pq.addEventListener('input', () => { sel = 0; draw(); });
  pq.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(1, results.length); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(1, results.length); draw(); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); go(results[sel].href); }
    else if (e.key === 'Escape') { e.preventDefault(); closePalette(); }
  });
  if (!/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) nav.querySelector('kbd').textContent = 'Ctrl K';
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); pal.hidden ? openPalette() : closePalette(); }
    else if (e.key === 'Escape') document.documentElement.classList.remove('tb-open');
  });

  // ---------- for the page ----------
  window.tbShell = {
    root: ROOT, page, served,
    get user() { return user; },
    favourites: () => favs.slice(),
    isFavourite: p => favs.includes(p),
    toggleFavourite(p) {
      favs = favs.includes(p) ? favs.filter(x => x !== p) : favs.concat(p);
      try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) { }
      renderTools(); listeners.forEach(f => f(favs.slice()));
    },
    onChange: f => listeners.push(f),
  };
})();
