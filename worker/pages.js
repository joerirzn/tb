// The sign-in, account and admin pages, in the Creative Toolbox design (shared/tool.css, like the tools).
// Account and admin also get the sidebar (shared/shell.js); the sign-in page has none, you are not signed in yet.
// Everything people type is put on the page with textContent, never as HTML.

// a JS string literal that is safe inside <script>: no "</script>" or "<!--" can break out
const jsStr = v => JSON.stringify(String(v)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/favicon.png?v=2">
<link rel="stylesheet" href="/shared/motion.css">
<link rel="stylesheet" href="/shared/tool.css">
<script src="/shared/motion.js" defer></script>`;

// pages with the sidebar: who is signed in goes on <body>, the same way the server does it for the tools
const SHELL_HEAD = HEAD + '\n<link rel="stylesheet" href="/shared/shell.css">';
const enc = v => encodeURIComponent(v || '');   // no quotes or brackets left, so safe inside an attribute
const shellBody = u => `<body data-tb-name="${enc(u.name)}" data-tb-job="${enc(u.jobTitle)}" data-tb-email="${enc(u.me)}" data-tb-admin="${u.isAdmin ? '1' : '0'}">
<script src="/shared/shell.js"></script>`;

const BASE_CSS = `
  .msg{ min-height: 1.5em; margin-top: 10px; }
  .msg:empty{ min-height: 0; margin: 0; }
  /* small actions, the same as .btn-ghost */
  .btn-utility{ display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 14px; white-space: nowrap;
    background: var(--surface); border: 1px solid var(--border-hover); color: var(--muted); border-radius: var(--radius-pill);
    font: 600 12.5px var(--font); cursor: pointer; transition: border-color .15s, color .15s, transform .1s; }
  .btn-utility:hover{ border-color: var(--text); color: var(--text); }
  .btn-utility:active{ transform: scale(.97); }
  .btn-utility.danger:hover{ color: var(--error); border-color: var(--error); }
  .two{ display: flex; gap: 8px; }
  .two .field{ flex: 1; min-width: 0; }
  /* a column of sections divided by hairlines, like the settings of a tool */
  .sheet{ display: flex; flex-direction: column; gap: 1px; background: var(--hairline); border: 1px solid var(--hairline); border-radius: var(--radius-lg); overflow: hidden; }
`;

export function loginPage({ next }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD}
<title>Creative Toolbox · Sign in</title>
<style>
${BASE_CSS}
  body{ align-items: center; justify-content: center; padding: 40px 16px; }
  .box{ width: 100%; max-width: 400px; }
  .brand{ display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
  .brand img{ width: 40px; height: 40px; border-radius: 11px; box-shadow: 0 0 0 1px var(--border-hover); }
  .brand h1{ font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
  .lead{ font-size: 13.5px; line-height: 1.5; color: var(--muted); margin: 0 0 18px; min-height: 2.6em; }
  .card{ background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 20px; }
  /* Sign in / Request access: one pill, the chosen side filled */
  .tabs{ display: flex; gap: 2px; padding: 3px; border-radius: var(--radius-pill); background: var(--field); border: 1px solid var(--border-hover); margin-bottom: 18px; }
  .tab{ flex: 1; height: 32px; border: none; background: none; border-radius: var(--radius-pill); color: var(--faint); font: 600 12.5px var(--font); cursor: pointer; transition: color .15s, background-color .15s; }
  .tab:hover{ color: var(--muted); }
  .tab.on{ background: var(--surface-3); color: var(--text); box-shadow: inset 0 0 0 1px var(--border-hover); }
  form .btn{ margin-top: 6px; }
  .done{ text-align: center; padding: 8px 0 4px; }
  .done .ic{ width: 44px; height: 44px; margin: 0 auto 12px; border-radius: 9999px; background: rgba(52, 211, 153, 0.12); color: var(--success); display: grid; place-items: center; }
  .done .ic svg{ width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .done h2{ font-size: 17px; font-weight: 700; margin: 0 0 6px; }
  .done p{ font-size: 13px; line-height: 1.55; color: var(--muted); margin: 0 0 16px; }
</style>
</head>
<body>
<main class="box">
  <div class="brand"><img src="/favicon.png?v=2" alt=""><h1>Creative Toolbox</h1></div>
  <p class="lead" id="lead">Sign in to open the tools.</p>
  <div class="card">
    <div class="tabs" role="tablist">
      <button class="tab on" type="button" role="tab" data-mode="login" aria-selected="true">Sign in</button>
      <button class="tab" type="button" role="tab" data-mode="register" aria-selected="false">Request access</button>
    </div>

    <form id="loginForm" novalidate>
      <div class="field"><label for="li-email">Email</label><input id="li-email" type="email" autocomplete="username" required></div>
      <div class="field"><label for="li-pw">Password</label><input id="li-pw" type="password" autocomplete="current-password" required></div>
      <button class="btn" type="submit">Sign in</button>
      <p class="msg" id="loginMsg" role="alert"></p>
    </form>

    <form id="registerForm" novalidate hidden>
      <div class="two">
        <div class="field"><label for="rg-first">First name</label><input id="rg-first" type="text" autocomplete="given-name" maxlength="40" required></div>
        <div class="field"><label for="rg-last">Last name</label><input id="rg-last" type="text" autocomplete="family-name" maxlength="40" required></div>
      </div>
      <div class="field"><label for="rg-job">Job title</label><input id="rg-job" type="text" autocomplete="organization-title" maxlength="80" required></div>
      <div class="field"><label for="rg-email">Email</label><input id="rg-email" type="email" autocomplete="email" required></div>
      <div class="field"><label for="rg-pw">Password <span class="opt">at least 10 characters</span></label><input id="rg-pw" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="field"><label for="rg-note">What do you need the Creative Toolbox for? <span class="opt">optional</span></label><textarea id="rg-note" maxlength="500"></textarea></div>
      <button class="btn" type="submit">Request access</button>
      <p class="msg" id="registerMsg" role="alert"></p>
    </form>

    <div class="done" id="done" hidden>
      <div class="ic"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h2>Request sent</h2>
      <p>Your request is waiting for approval. Once it has been accepted, you can sign in with this email and password.</p>
      <button class="btn-utility" type="button" id="backToLogin">Back to sign in</button>
    </div>
  </div>
</main>
<script>
(function () {
  var next = ${jsStr(next)};
  var $ = function (id) { return document.getElementById(id); };
  var tabs = document.querySelectorAll('.tab');
  function mode(m) {
    tabs.forEach(function (t) { var on = t.dataset.mode === m; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
    $('loginForm').hidden = m !== 'login';
    $('registerForm').hidden = m !== 'register';
    $('done').hidden = true;
    $('lead').textContent = m === 'login' ? 'Sign in to open the tools.' : 'No account yet? Request access. The admin accepts or declines your request.';
    if (window.tbIn) tbIn(m === 'login' ? $('loginForm') : $('registerForm'));
    var first = m === 'login' ? $('li-email') : $('rg-first'); first.focus();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { mode(t.dataset.mode); }); });
  $('backToLogin').addEventListener('click', function () { mode('login'); });

  async function post(url, data) {
    var r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    var j = {}; try { j = await r.json(); } catch (e) {}
    return { ok: r.ok, data: j };
  }
  function busy(form, on) { form.querySelector('.btn').disabled = on; }

  $('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('loginMsg'); msg.className = 'msg'; msg.textContent = '';
    var email = $('li-email').value.trim(), pw = $('li-pw').value;
    if (!email || !pw) { msg.className = 'msg err'; msg.textContent = 'Fill in your email and password.'; return; }
    busy(this, true);
    try {
      var r = await post('/auth/login', { email: email, password: pw, next: next });
      if (r.ok) { location.href = r.data.next || '/'; return; }
      msg.className = 'msg err'; msg.textContent = r.data.error || 'Signing in failed. Try again.';
    } catch (err) { msg.className = 'msg err'; msg.textContent = 'No connection. Try again.'; }
    busy(this, false);
  });

  $('registerForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('registerMsg'); msg.className = 'msg'; msg.textContent = '';
    var data = { firstName: $('rg-first').value.trim(), lastName: $('rg-last').value.trim(), jobTitle: $('rg-job').value.trim(), email: $('rg-email').value.trim(), password: $('rg-pw').value, note: $('rg-note').value.trim(), next: next };
    if (!data.firstName || !data.lastName) { msg.className = 'msg err'; msg.textContent = 'Fill in your first and last name.'; return; }
    if (!data.jobTitle) { msg.className = 'msg err'; msg.textContent = 'Fill in your job title.'; return; }
    if (!data.email || !data.password) { msg.className = 'msg err'; msg.textContent = 'Fill in your email and a password.'; return; }
    if (data.password.length < 10) { msg.className = 'msg err'; msg.textContent = 'Use a password of at least 10 characters.'; return; }
    busy(this, true);
    try {
      var r = await post('/auth/register', data);
      if (r.ok && r.data.pending) { this.hidden = true; $('done').hidden = false; if (window.tbIn) tbIn($('done')); $('li-email').value = data.email; this.reset(); }
      else if (r.ok) { location.href = r.data.next || '/'; return; }
      else { msg.className = 'msg err'; msg.textContent = r.data.error || 'Sending the request failed. Try again.'; }
    } catch (err) { msg.className = 'msg err'; msg.textContent = 'No connection. Try again.'; }
    busy(this, false);
  });

  $('li-email').focus();
})();
</script>
</body>
</html>`;
}

export function adminPage({ me, name, jobTitle }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${SHELL_HEAD}
<title>Creative Toolbox · Access</title>
<style>
${BASE_CSS}
  .status{ font-size: 12.5px; color: var(--muted); min-height: 1.4em; margin: -4px 0 12px; }
  .status:empty{ display: none; }
  .status.err{ color: var(--error); }
  .count{ font-weight: 500; color: var(--faint); margin-left: 6px; }
  .intro{ font-size: 12.5px; line-height: 1.5; color: var(--faint); margin: -6px 0 12px; max-width: 80ch; }
  .empty{ font-size: 12.5px; color: var(--faint); margin: 0; }
  /* one person (or announcement) per row */
  .person{ display: flex; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .person:first-child{ border-top: none; padding-top: 0; }
  .who{ flex: 1; min-width: 220px; }
  .name{ font-size: 13.5px; font-weight: 700; }
  .badge{ font-size: 10.5px; font-weight: 700; color: #fff; background: var(--accent); border-radius: 5px; padding: 1px 7px; margin-left: 8px; vertical-align: 1px; }
  .job{ font-weight: 500; color: var(--muted); }
  .email{ font-size: 12.5px; color: var(--muted); margin-top: 1px; word-break: break-all; }
  .who .note{ font-size: 12.5px; color: var(--muted); margin-top: 6px; line-height: 1.5; white-space: pre-wrap; max-width: 80ch; }
  .meta{ font-size: 11.5px; color: var(--faint); margin-top: 4px; }
  .actions{ display: flex; gap: 6px; flex-wrap: wrap; }
  .actions .btn{ width: auto; height: 34px; font-size: 12.5px; padding: 0 16px; }
  .pw{ font-size: 12.5px; color: var(--warning); margin-top: 8px; }
  .pw code{ font-size: 13px; color: var(--text); background: var(--field); border: 1px solid var(--border-hover); border-radius: 8px; padding: 2px 8px; user-select: all; }
  /* recent activity */
  .act{ display: grid; grid-template-columns: 160px minmax(0, 1fr) 220px; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border); font-size: 12.5px; }
  .act:first-child{ border-top: none; padding-top: 0; }
  .act .t{ color: var(--faint); }
  .act .p{ color: var(--muted); }
  @media (max-width: 700px){ .act{ grid-template-columns: 1fr; gap: 2px; } }
</style>
</head>
${shellBody({ me, name, jobTitle, isAdmin: true })}
<div class="app-header">
  <h1>Access <span>· requests and people with access</span></h1>
</div>
<p class="status" id="status" role="status"></p>

<div class="sheet">
  <section class="sb-section"><div class="section-label plain">Requests<span class="count" id="c-pending"></span></div><div id="pending"></div></section>
  <section class="sb-section"><div class="section-label plain">People with access<span class="count" id="c-approved"></span></div><div id="approved"></div></section>
  <section class="sb-section"><div class="section-label plain">Declined or removed<span class="count" id="c-denied"></span></div><div id="denied"></div></section>
  <section class="sb-section">
    <div class="section-label plain">New tool announcements<span class="end">sent automatically</span></div>
    <p class="intro">When a new tool appears on the Creative Toolbox home, everyone with access gets a notification. Admin-only tools are announced once they are opened up to everyone.</p>
    <div id="announcements"></div>
  </section>
  <section class="sb-section"><div class="section-label plain">Recent activity<span class="end">last 100 opened pages</span></div><div id="activity"></div></section>
</div>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var TOOLS = { '/': 'Home', '/admin': 'Admin', '/banner-generator/': 'Social Banner Creator', '/cover-converter/': 'Cover Converter',
    '/sessions-radio-maker/': 'Sessions Asset Generator', '/thumbnail-maker/': 'Thumbnail Maker', '/song-briefing/': 'Song Briefing', '/general-briefing/': 'General Briefing', '/ideas/': 'Ideas' };

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function when(t) {
    if (!t) return 'never';
    var d = Date.now() - t, m = Math.round(d / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    if (m < 60 * 24) return Math.round(m / 60) + ' h ago';
    return new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function status(s, err) { var e = $('status'); e.textContent = s || ''; e.className = 'status' + (err ? ' err' : ''); }

  async function call(action, id, confirmText) {
    if (confirmText && !confirm(confirmText)) return null;
    var r = await fetch('/admin/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { status(j.error || 'That did not work. Reload and try again.', true); return null; }
    return j;
  }
  function button(text, cls, onClick) { var b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', onClick); return b; }

  function person(u, buttons, metaText) {
    var row = el('div', 'person'), who = el('div', 'who');
    var name = el('div', 'name', u.name || '(no name)');
    if (u.job_title) name.appendChild(el('span', 'job', ' · ' + u.job_title));
    if (u.is_admin) name.appendChild(el('span', 'badge', 'Admin'));
    who.appendChild(name);
    who.appendChild(el('div', 'email', u.email));
    if (u.note) who.appendChild(el('div', 'note', u.note));
    who.appendChild(el('div', 'meta', metaText));
    var actions = el('div', 'actions');
    buttons.forEach(function (b) { actions.appendChild(b); });
    row.appendChild(who); row.appendChild(actions);
    return { row: row, who: who };
  }

  function fill(box, countEl, list, render, emptyText) {
    box.innerHTML = '';
    countEl.textContent = list.length ? String(list.length) : '';
    if (!list.length) { box.appendChild(el('p', 'empty', emptyText)); return; }
    list.forEach(function (u) { box.appendChild(render(u)); });
  }

  var firstLoad = true;
  async function load() {
    var r = await fetch('/admin/api/users');
    if (!r.ok) { status('Could not load the list. Reload the page.', true); return; }
    var data = await r.json(), users = data.users;
    var mine = ${jsStr(me)};

    fill($('pending'), $('c-pending'), users.filter(function (u) { return u.status === 'pending'; }), function (u) {
      return person(u, [
        button('Accept', 'btn', async function () { if (await call('approve', u.id)) { status('Accepted ' + u.email + '. They can sign in now.'); load(); } }),
        button('Decline', 'btn-utility danger', async function () { if (await call('deny', u.id, 'Decline the request from ' + u.email + '?')) { status('Declined ' + u.email + '.'); load(); } })
      ], 'Requested ' + when(u.created_at)).row;
    }, 'No open requests.');

    fill($('approved'), $('c-approved'), users.filter(function (u) { return u.status === 'approved'; }), function (u) {
      var self = u.email === mine, p;
      var buttons = self ? [] : [
        button('Reset password', 'btn-utility', async function () {
          var j = await call('reset-password', u.id, 'Give ' + u.email + ' a new password? Their current password stops working.');
          if (!j) return;
          var old = p.who.querySelector('.pw'); if (old) old.remove();
          var line = el('div', 'pw', 'New password for ' + u.email + ' (shown once, send it to them): ');
          line.appendChild(el('code', null, j.password));
          p.who.appendChild(line);
        }),
        button('Remove access', 'btn-utility danger', async function () { if (await call('revoke', u.id, 'Remove access for ' + u.email + '? They are signed out right away.')) { status('Removed access for ' + u.email + '.'); load(); } })
      ];
      p = person(u, buttons, 'Last active ' + when(u.last_seen_at) + ' · last sign-in ' + when(u.last_login_at) + ' · access since ' + when(u.decided_at || u.created_at));
      return p.row;
    }, 'Nobody has access yet.');

    fill($('denied'), $('c-denied'), users.filter(function (u) { return u.status === 'denied'; }), function (u) {
      return person(u, [
        button('Give access', 'btn-utility', async function () { if (await call('approve', u.id, 'Give ' + u.email + ' access?')) { status('Gave access to ' + u.email + '.'); load(); } }),
        button('Delete', 'btn-utility danger', async function () { if (await call('delete', u.id, 'Delete ' + u.email + ' completely? They can then request access again.')) { status('Deleted ' + u.email + '.'); load(); } })
      ], 'Since ' + when(u.decided_at)).row;
    }, 'Nobody.');

    var act = $('activity'); act.innerHTML = '';
    if (!data.activity.length) act.appendChild(el('p', 'empty', 'Nothing yet.'));
    data.activity.forEach(function (a) {
      var row = el('div', 'act');
      row.appendChild(el('span', 't', when(a.at)));
      row.appendChild(el('span', null, (a.name || a.email) + ' · ' + a.email));
      row.appendChild(el('span', 'p', TOOLS[a.path] || a.path));
      act.appendChild(row);
    });
    // the lists come in one after the other the first time; later updates stay still
    if (firstLoad && window.tbStagger) tbStagger(document.querySelectorAll('.sheet > section'), 45);
    firstLoad = false;
  }
  // ---- announcements ----
  async function loadAnnouncements() {
    var r = await fetch('/admin/api/announcements'); if (!r.ok) return;
    var list = (await r.json()).announcements, box = $('announcements'); box.innerHTML = '';
    list.forEach(function (a) {
      var row = el('div', 'person'), who = el('div', 'who');
      who.appendChild(el('div', 'name', 'New tool: ' + a.title));
      if (a.body) who.appendChild(el('div', 'note', a.body));
      who.appendChild(el('div', 'meta', when(a.created_at) + ' · opens ' + (TOOLS[a.link] || a.link) + ' · sent to ' + a.sent + ', opened by ' + a.opened));
      var del = button('Delete', 'btn-utility danger', async function () {
        if (!confirm('Delete this announcement? It also disappears from the notifications of everyone.')) return;
        var x = await fetch('/admin/api/announcements/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id }) });
        if (x.ok) { status('Announcement deleted.'); loadAnnouncements(); } else status('Deleting failed. Reload and try again.', true);
      });
      row.appendChild(who); row.appendChild(el('div', 'actions')).appendChild(del);
      box.appendChild(row);
    });
  }
  load();
  loadAnnouncements();
})();
</script>
</body>
</html>`;
}

export function accountPage({ me, name, jobTitle, isAdmin }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${SHELL_HEAD}
<title>Creative Toolbox · Account</title>
<style>
${BASE_CSS}
  .sheet{ max-width: 560px; }
  .sub{ font-size: 12.5px; line-height: 1.5; color: var(--faint); margin: -6px 0 14px; }
  .signed{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .signed .who{ flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; word-break: break-all; }
  form .btn{ margin-top: 4px; }
</style>
</head>
${shellBody({ me, name, jobTitle, isAdmin })}
<div class="app-header">
  <h1>Account <span>· your profile and password</span></h1>
</div>

<div class="sheet">
  <section class="sb-section">
    <div class="section-label plain">Signed in as</div>
    <div class="signed"><span class="who" id="me"></span><button class="btn-utility" type="button" id="signOut">Sign out</button></div>
  </section>

  <section class="sb-section">
    <div class="section-label plain">Profile</div>
    <p class="sub">Shown in the Creative Toolbox and to the admin.</p>
    <form id="nameForm" novalidate>
      <div class="two">
        <div class="field"><label for="nm-first">First name</label><input id="nm-first" type="text" autocomplete="given-name" maxlength="40" required></div>
        <div class="field"><label for="nm-last">Last name</label><input id="nm-last" type="text" autocomplete="family-name" maxlength="40" required></div>
      </div>
      <div class="field"><label for="nm-job">Job title</label><input id="nm-job" type="text" autocomplete="organization-title" maxlength="80" required></div>
      <button class="btn" type="submit">Save profile</button>
      <p class="msg" id="nameMsg" role="alert"></p>
    </form>
  </section>

  <section class="sb-section">
    <div class="section-label plain">Change password</div>
    <p class="sub">You stay signed in here; other devices are signed out.</p>
    <form id="pwForm" novalidate>
      <input type="email" autocomplete="username" id="user" hidden>
      <div class="field"><label for="cur">Current password</label><input id="cur" type="password" autocomplete="current-password" required></div>
      <div class="field"><label for="pw1">New password <span class="opt">at least 10 characters</span></label><input id="pw1" type="password" autocomplete="new-password" minlength="10" required></div>
      <div class="field"><label for="pw2">New password again</label><input id="pw2" type="password" autocomplete="new-password" minlength="10" required></div>
      <button class="btn" type="submit">Change password</button>
      <p class="msg" id="msg" role="alert"></p>
    </form>
  </section>
</div>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var me = ${jsStr(me)}, name = ${jsStr(name || '')}, job = ${jsStr(jobTitle || '')};
  function showMe() { $('me').textContent = name ? name + ' · ' + me : me; }
  showMe(); $('user').value = me;
  // the name is stored as "First Last": everything after the first space is the last name
  var cut = name.indexOf(' ');
  $('nm-first').value = cut < 0 ? name : name.slice(0, cut);
  $('nm-last').value = cut < 0 ? '' : name.slice(cut + 1);
  $('nm-job').value = job;
  if (!job) { var m0 = $('nameMsg'); m0.className = 'msg err'; m0.textContent = 'Your job title is missing. Fill it in and save.'; }
  $('nameForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('nameMsg'), btn = this.querySelector('.btn');
    msg.className = 'msg'; msg.textContent = '';
    var first = $('nm-first').value.trim(), last = $('nm-last').value.trim(), jt = $('nm-job').value.trim();
    if (!first || !last) { msg.className = 'msg err'; msg.textContent = 'Fill in your first and last name.'; return; }
    if (!jt) { msg.className = 'msg err'; msg.textContent = 'Fill in your job title.'; return; }
    btn.disabled = true;
    try {
      var r = await fetch('/auth/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firstName: first, lastName: last, jobTitle: jt }) });
      var j = {}; try { j = await r.json(); } catch (err) {}
      if (r.ok) { name = j.name; job = j.jobTitle; showMe(); msg.className = 'msg ok'; msg.textContent = 'Profile saved.'; }
      else { msg.className = 'msg err'; msg.textContent = j.error || 'Saving the profile failed. Try again.'; }
    } catch (err) { msg.className = 'msg err'; msg.textContent = 'No connection. Try again.'; }
    btn.disabled = false;
  });
  $('signOut').addEventListener('click', async function () {
    try { await fetch('/auth/logout', { method: 'POST' }); } catch (e) {}
    location.href = '/login';
  });
  $('pwForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = $('msg'), btn = this.querySelector('.btn');
    msg.className = 'msg'; msg.textContent = '';
    var cur = $('cur').value, pw1 = $('pw1').value, pw2 = $('pw2').value;
    if (!cur || !pw1) { msg.className = 'msg err'; msg.textContent = 'Fill in your current and new password.'; return; }
    if (pw1.length < 10) { msg.className = 'msg err'; msg.textContent = 'Use a new password of at least 10 characters.'; return; }
    if (pw1 !== pw2) { msg.className = 'msg err'; msg.textContent = 'The two new passwords are not the same.'; return; }
    btn.disabled = true;
    try {
      var r = await fetch('/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: cur, password: pw1 }) });
      var j = {}; try { j = await r.json(); } catch (err) {}
      if (r.ok) { msg.className = 'msg ok'; msg.textContent = 'Password changed.'; this.reset(); }
      else { msg.className = 'msg err'; msg.textContent = j.error || 'Changing the password failed. Try again.'; }
    } catch (err) { msg.className = 'msg err'; msg.textContent = 'No connection. Try again.'; }
    btn.disabled = false;
  });
})();
</script>
</body>
</html>`;
}
