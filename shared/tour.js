// The welcome tour: the first time someone opens the Creative Toolbox home, a short walk past the main parts.
// It opens by itself once per account (the server remembers it, see /api/tour) and can be taken again from
// the profile menu ("Take the tour", which opens the home with #tour). Loaded by index.html, after shared/shell.js.
(function () {
  const shell = window.tbShell; if (!shell) return;
  const first = (shell.user.name || '').split(/\s+/)[0];
  const narrow = () => innerWidth <= 860;   // phones: the sidebar is a menu that slides in

  // what the tour shows; `at` is the part of the page it points to (none = a card in the middle)
  const STEPS = [
    { title: 'Welcome' + (first ? ', ' + first : '') + '!', text: 'Everything you need to create assets for our releases and artists, in one place. Let us show you around.', intro: true },
    { at: '#toolGrid', title: 'Your tools', text: 'Click a tool to open it. Use the star on a tool to keep it at the top, here and in the sidebar.', side: 'bottom' },
    { at: '#tbToolGroup', title: 'Always one click away', text: 'The sidebar is on every page, so you can jump from one tool to the next.', side: 'right', nav: true },
    { at: '#tbSearch', title: 'Search', text: 'Looking for something? Press ⌘K (Ctrl K on Windows) from anywhere and type a few letters.', side: 'right', nav: true },
    { at: '[data-key="time"]', title: 'Time saved', text: 'Every export counts. See how much time the team saves with the tools, and the next milestone.', side: 'right', nav: true },
    { at: '#tbSuggest', title: 'Missing a tool?', text: 'Suggest a tool, or a better way for an existing one. Only the admin sees your suggestion, and you hear back in your notifications.', side: 'right', nav: true },
    { at: '#notify', title: 'Notifications', text: 'New tools, updates and replies to your suggestions show up here.', side: 'right', nav: true },
    { at: '.tb-me', title: 'You', text: 'Your account and password, your suggestions, and this tour again whenever you like.', side: 'right', nav: true, up: true },
    { title: 'You are all set', text: 'Pick a tool and make something. Have fun!', outro: true },
  ];

  const css = `
    .tour-block{ position: fixed; inset: 0; z-index: 200; }
    .tour-hole{ position: fixed; z-index: 201; border-radius: 14px; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0,0,0,0.7), 0 0 0 2px rgba(139,92,246,0.9);
      transition: left .35s cubic-bezier(.2,.8,.2,1), top .35s cubic-bezier(.2,.8,.2,1), width .35s cubic-bezier(.2,.8,.2,1), height .35s cubic-bezier(.2,.8,.2,1), opacity .25s ease; }
    .tour-hole.none{ left: 50% !important; top: 50% !important; width: 0 !important; height: 0 !important; box-shadow: 0 0 0 9999px rgba(0,0,0,0.7); }
    .tour-card{ position: fixed; z-index: 202; width: 340px; max-width: calc(100vw - 32px); background: #141414; border: 1px solid rgba(255,255,255,0.14); border-radius: 16px;
      padding: 18px; color: #f5f5f5; font: 500 13.5px/1.5 'Plus Jakarta Sans', 'Inter', -apple-system, system-ui, sans-serif; box-shadow: 0 30px 80px rgba(0,0,0,0.7);
      transition: left .35s cubic-bezier(.2,.8,.2,1), top .35s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }
    .tour-card.center{ width: 420px; text-align: center; padding: 28px 26px 22px; }
    .tour-card .tour-logo{ width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 14px; display: block; box-shadow: 0 0 0 1px rgba(255,255,255,0.14); }
    .tour-card h3{ margin: 0 0 6px; font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
    .tour-card.center h3{ font-size: 20px; }
    .tour-card p{ margin: 0; color: #a6a6a6; font-size: 13px; }
    .tour-foot{ display: flex; align-items: center; gap: 8px; margin-top: 16px; }
    .tour-card.center .tour-foot{ justify-content: center; margin-top: 20px; }
    .tour-dots{ display: flex; gap: 5px; margin-right: auto; }
    .tour-dots i{ width: 6px; height: 6px; border-radius: 9999px; background: rgba(255,255,255,0.18); transition: background-color .2s ease, width .2s ease; }
    .tour-dots i.on{ background: #8b5cf6; width: 16px; }
    .tour-card button{ height: 34px; padding: 0 14px; border-radius: 9999px; font: 600 12.5px inherit; font-family: inherit; cursor: pointer; transition: background-color .15s, border-color .15s, color .15s; }
    .tour-next{ background: #f5f5f5; color: #0a0a0a; border: none; font-weight: 700 !important; }
    .tour-next:hover{ background: #fff; }
    .tour-back, .tour-skip{ background: none; color: #a6a6a6; border: 1px solid rgba(255,255,255,0.14); }
    .tour-back:hover, .tour-skip:hover{ color: #fff; border-color: rgba(255,255,255,0.3); }
    .tour-skip.link{ border: none; padding: 0 6px; }
    .tour-card button:focus-visible{ outline: 2px solid #8b5cf6; outline-offset: 2px; }
    @starting-style{ .tour-card{ opacity: 0; } .tour-hole{ opacity: 0; } }
    @media (prefers-reduced-motion: reduce){ .tour-hole, .tour-card{ transition: none; } }
  `;

  let i = 0, hole, card, block, before;

  function start() {
    if (document.querySelector('.tour-card')) return;
    if (!document.getElementById('tourCss')) { const st = document.createElement('style'); st.id = 'tourCss'; st.textContent = css; document.head.appendChild(st); }
    before = document.activeElement;
    block = document.createElement('div'); block.className = 'tour-block';
    hole = document.createElement('div'); hole.className = 'tour-hole none';
    card = document.createElement('div'); card.className = 'tour-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'tourTitle');
    document.body.append(block, hole, card);
    block.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('keydown', keys, true);
    addEventListener('resize', place);
    i = 0; show();
  }

  function keys(e) {
    if (!card) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); finish(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  }
  function next() { if (i < STEPS.length - 1) { i++; show(); } else finish(); }
  function back() { if (i > 0) { i--; show(); } }

  function show() {
    const s = STEPS[i], last = i === STEPS.length - 1, plain = !s.at;
    // on a phone, steps in the sidebar open it
    document.documentElement.classList.toggle('tb-open', !!(s.nav && narrow()));
    card.className = 'tour-card' + (plain ? ' center' : '');
    card.innerHTML = '';
    if (s.intro || s.outro) { const im = document.createElement('img'); im.className = 'tour-logo'; im.src = shell.root + 'favicon.png?v=2'; im.alt = ''; card.appendChild(im); }
    const h = document.createElement('h3'); h.id = 'tourTitle'; h.textContent = s.title;
    const p = document.createElement('p'); p.textContent = s.text;
    const foot = document.createElement('div'); foot.className = 'tour-foot';
    const btn = (cls, text, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
    if (s.intro) foot.append(btn('tour-skip', 'Skip', finish), btn('tour-next', 'Show me around', next));
    else if (s.outro) foot.append(btn('tour-next', 'Start using the toolbox', finish));
    else {
      const dots = document.createElement('div'); dots.className = 'tour-dots';
      STEPS.slice(1, -1).forEach((_, k) => { const d = document.createElement('i'); if (k === i - 1) d.className = 'on'; dots.appendChild(d); });
      foot.append(dots, btn('tour-skip link', 'Skip', finish), btn('tour-back', 'Back', back), btn('tour-next', last ? 'Done' : 'Next', next));
    }
    card.append(h, p, foot);
    // the sidebar slides in on a phone; place once it is there
    setTimeout(place, s.nav && narrow() ? 280 : 0);
    place();
    const n = card.querySelector('.tour-next'); if (n) n.focus({ preventScroll: true });
  }

  function place() {
    if (!card) return;
    const s = STEPS[i], el = s.at && document.querySelector(s.at);
    const vw = innerWidth, vh = innerHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    if (!el || !el.getClientRects().length) {
      hole.classList.add('none');
      card.style.left = Math.round((vw - cw) / 2) + 'px'; card.style.top = Math.round((vh - ch) / 2) + 'px';
      return;
    }
    let r = el.getBoundingClientRect();
    // a part of the page that is out of view is scrolled to (the sidebar is fixed, it never needs it)
    if (!s.nav && (r.top < 70 || r.top > vh * 0.5)) { scrollTo({ top: Math.max(0, scrollY + r.top - 80), behavior: 'instant' }); r = el.getBoundingClientRect(); }
    // a big area (the tool grid) is shown as its top part, so the card fits below it
    const pad = 6, maxH = s.side === 'bottom' ? Math.min(r.height, vh * 0.5) : r.height;
    const box = { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: maxH + pad * 2 };
    hole.classList.remove('none');
    Object.assign(hole.style, { left: box.left + 'px', top: box.top + 'px', width: box.width + 'px', height: box.height + 'px' });
    let x, y;
    if (s.side === 'right' && box.left + box.width + 16 + cw <= vw - 12) {
      x = box.left + box.width + 16;
      y = s.up ? box.top + box.height - ch : box.top + box.height / 2 - ch / 2;
    } else if (box.top + box.height + 14 + ch <= vh - 12) {
      x = Math.min(Math.max(12, box.left + 24), vw - cw - 12); y = box.top + box.height + 14;
    } else {
      x = Math.min(Math.max(12, box.left + 24), vw - cw - 12); y = box.top - ch - 14;
    }
    card.style.left = Math.round(Math.min(Math.max(12, x), vw - cw - 12)) + 'px';
    card.style.top = Math.round(Math.min(Math.max(12, y), vh - ch - 12)) + 'px';
  }

  function finish() {
    document.removeEventListener('keydown', keys, true);
    removeEventListener('resize', place);
    document.documentElement.classList.remove('tb-open');
    [block, hole, card].forEach(e => e && e.remove()); block = hole = card = null;
    if (location.hash === '#tour') history.replaceState(null, '', location.pathname + location.search);
    if (before && before.focus) before.focus({ preventScroll: true });
    // remembered for the account (online) or this browser (a file preview)
    if (shell.served) fetch('/api/tour', { method: 'POST' }).catch(() => { });
    else try { localStorage.setItem('toolbox.toured', '1'); } catch (e) { }
  }

  window.tbTour = start;
  // the first visit, or "Take the tour" from the profile menu
  let toured = document.body.dataset.tbToured === '1';
  if (!shell.served) { try { toured = localStorage.getItem('toolbox.toured') === '1'; } catch (e) { } }
  const go = () => setTimeout(start, 500);   // after the page has come in
  if (location.hash === '#tour' || !toured) { if (document.readyState === 'complete') go(); else addEventListener('load', go); }
  addEventListener('hashchange', () => { if (location.hash === '#tour') start(); });
})();
