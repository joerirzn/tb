// Login and admin pages, in the Toolbox style (see STYLE_GUIDE.md).
// Everything people type is put on the page with textContent, never as HTML.

// a JS string literal that is safe inside <script>: no "</script>" or "<!--" can break out
const jsStr = v => JSON.stringify(String(v)).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">`;

const BASE_CSS = `
  :root{
    --bg: #000000; --surface: #272729; --surface-2: #2a2a2c; --surface-3: #252527;
    --border: rgba(255,255,255,0.08); --border-hover: rgba(255,255,255,0.16);
    --text: #ffffff; --text-muted: #cccccc; --text-faint: #86868b;
    --accent: #2997ff; --accent-focus: #0071e3; --on-accent: #ffffff;
    --success: #30d158; --warning: #ffd60a; --error: #ff453a;
    --font: 'Inter', -apple-system, system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  *{ box-sizing: border-box; }
  html, body{ margin: 0; padding: 0; }
  body{ background: var(--bg); color: var(--text); font-family: var(--font); -webkit-font-smoothing: antialiased; min-height: 100vh; }
  ::selection{ background: var(--accent); color: #fff; }
  a{ color: var(--accent); text-decoration: none; }
  button{ font-family: inherit; cursor: pointer; }
  button:active{ transform: scale(0.95); }
  button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible{ outline: 2px solid var(--accent-focus); outline-offset: 3px; }
  .card{ background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 24px; }
  .btn{ background: var(--accent); color: var(--on-accent); border: none; border-radius: 9999px; font: 400 17px var(--font); padding: 11px 22px; transition: transform .1s ease; }
  .btn:disabled{ background: var(--surface-2); color: var(--text-faint); cursor: default; transform: none; }
  .btn-utility{ background: transparent; color: var(--text); border: 1px solid var(--border-hover); border-radius: 9999px; padding: 8px 15px; font: 400 14px var(--font); transition: transform .1s ease, border-color .15s ease; }
  .btn-utility:hover{ border-color: var(--text-faint); }
  .btn-utility.danger:hover{ color: #e55; border-color: #e55; }
  input, textarea{ width: 100%; background: var(--surface-3); border: 1px solid var(--border); color: var(--text); border-radius: 9999px; padding: 12px 20px; font: 400 17px var(--font); }
  textarea{ border-radius: 18px; resize: vertical; min-height: 84px; line-height: 1.47; }
  input:focus, textarea:focus{ outline: none; border-color: var(--accent); }
  input::placeholder, textarea::placeholder{ color: var(--text-faint); }
  @media (prefers-reduced-motion: reduce){ *{ animation-duration: .001s !important; transition-duration: .001s !important; } }
`;

export function loginPage({ next }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD}
<title>Toolbox · Sign in</title>
<style>
${BASE_CSS}
  body{ display: flex; align-items: center; justify-content: center; padding: 40px 16px; }
  .box{ width: 100%; max-width: 420px; animation: rise .5s ease both; }
  @keyframes rise{ from{ opacity: 0; transform: translateY(10px); } to{ opacity: 1; transform: none; } }
  .brand{ display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }
  .brand img{ width: 44px; height: 44px; border-radius: 10px; }
  h1{ font-size: 32px; font-weight: 600; letter-spacing: -0.03em; margin: 0; }
  .lead{ font-size: 17px; line-height: 1.47; color: var(--text-muted); margin: 0 0 24px; }
  .tabs{ display: flex; gap: 4px; background: var(--surface-3); border: 1px solid var(--border); border-radius: 9999px; padding: 4px; margin-bottom: 20px; }
  .tab{ flex: 1; background: transparent; border: none; color: var(--text-faint); font: 400 14px var(--font); padding: 8px 12px; border-radius: 9999px; }
  .tab.on{ background: var(--surface-2); color: var(--text); }
  .tab:active{ transform: none; }
  form{ display: flex; flex-direction: column; gap: 12px; }
  label{ font-size: 13px; color: var(--text-muted); margin: 4px 0 -4px 20px; }
  .two{ display: flex; gap: 10px; }
  .two .col{ flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
  .hint{ font-size: 12px; color: var(--text-faint); margin: -4px 0 0 20px; }
  .btn{ margin-top: 8px; }
  .msg{ font-size: 14px; line-height: 1.5; margin: 4px 0 0; min-height: 1.5em; }
  .msg.err{ color: var(--error); }
  .msg.ok{ color: var(--success); }
  .done{ text-align: center; padding: 8px 0; }
  .done h2{ font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin: 0 0 8px; }
  .done p{ font-size: 15px; line-height: 1.5; color: var(--text-muted); margin: 0 0 20px; }
  .foot{ font-size: 12px; color: var(--text-faint); text-align: center; margin-top: 20px; }
  [hidden]{ display: none !important; }
</style>
</head>
<body>
<main class="box">
  <div class="brand"><img src="/favicon.png" alt=""><h1>Toolbox</h1></div>
  <p class="lead" id="lead">Sign in to open the tools.</p>
  <div class="card">
    <div class="tabs" role="tablist">
      <button class="tab on" type="button" role="tab" data-mode="login" aria-selected="true">Sign in</button>
      <button class="tab" type="button" role="tab" data-mode="register" aria-selected="false">Request access</button>
    </div>

    <form id="loginForm" novalidate>
      <label for="li-email">Email</label>
      <input id="li-email" type="email" autocomplete="username" required>
      <label for="li-pw">Password</label>
      <input id="li-pw" type="password" autocomplete="current-password" required>
      <button class="btn" type="submit">Sign in</button>
      <p class="msg" id="loginMsg" role="alert"></p>
    </form>

    <form id="registerForm" novalidate hidden>
      <div class="two">
        <div class="col"><label for="rg-first">First name</label><input id="rg-first" type="text" autocomplete="given-name" maxlength="40" required></div>
        <div class="col"><label for="rg-last">Last name</label><input id="rg-last" type="text" autocomplete="family-name" maxlength="40" required></div>
      </div>
      <label for="rg-job">Job title</label>
      <input id="rg-job" type="text" autocomplete="organization-title" maxlength="80" required>
      <label for="rg-email">Email</label>
      <input id="rg-email" type="email" autocomplete="email" required>
      <label for="rg-pw">Password</label>
      <input id="rg-pw" type="password" autocomplete="new-password" minlength="10" required>
      <p class="hint">At least 10 characters.</p>
      <label for="rg-note">What do you need the Toolbox for? <span style="color:var(--text-faint)">(optional)</span></label>
      <textarea id="rg-note" maxlength="500"></textarea>
      <button class="btn" type="submit">Request access</button>
      <p class="msg" id="registerMsg" role="alert"></p>
    </form>

    <div class="done" id="done" hidden>
      <h2>Request sent</h2>
      <p>Your request is waiting for approval. Once it has been accepted, you can sign in with this email and password.</p>
      <button class="btn-utility" type="button" id="backToLogin">Back to sign in</button>
    </div>
  </div>
  <p class="foot">Internal use only.</p>
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
      if (r.ok && r.data.pending) { this.hidden = true; $('done').hidden = false; $('li-email').value = data.email; this.reset(); }
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

export function adminPage({ me }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD}
<title>Toolbox · Admin</title>
<style>
${BASE_CSS}
  .wrap{ max-width: 1100px; margin: 0 auto; padding: 40px 40px 80px; }
  @media (max-width: 600px){ .wrap{ padding: 24px 16px 60px; } }
  header{ display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
  .left{ display: flex; align-items: center; gap: 16px; }
  .back{ display: inline-flex; align-items: center; gap: 6px; color: var(--text); border: 1px solid var(--border-hover); border-radius: 9999px; padding: 8px 15px; font-size: 14px; }
  .back svg{ width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
  h1{ font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
  .me{ font-size: 13px; color: var(--text-faint); }
  section{ margin-bottom: 20px; }
  .card-head{ display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
  h2{ font-size: 17px; font-weight: 600; margin: 0; }
  .count{ font-size: 13px; color: var(--text-faint); }
  .empty{ font-size: 14px; color: var(--text-faint); margin: 12px 0 0; }
  .row{ display: flex; align-items: center; gap: 16px; padding: 14px 0; border-top: 1px solid var(--border); flex-wrap: wrap; }
  .row:first-of-type{ border-top: none; }
  .who{ flex: 1; min-width: 220px; }
  .name{ font-size: 15px; font-weight: 600; }
  .badge{ font-size: 11px; font-weight: 400; color: var(--text-faint); border: 1px solid var(--border-hover); border-radius: 9999px; padding: 1px 8px; margin-left: 8px; vertical-align: 1px; }
  .job{ font-weight: 400; color: var(--text-muted); }
  .email{ font-size: 13px; color: var(--text-muted); margin-top: 2px; word-break: break-all; }
  .note{ font-size: 13px; color: var(--text-muted); margin-top: 6px; line-height: 1.5; white-space: pre-wrap; }
  .meta{ font-size: 12px; color: var(--text-faint); margin-top: 4px; }
  .actions{ display: flex; gap: 8px; flex-wrap: wrap; }
  .actions .btn{ font-size: 14px; padding: 8px 16px; }
  .pw{ font-size: 13px; color: var(--warning); margin-top: 6px; }
  .pw code{ font-size: 14px; color: var(--text); background: var(--surface-3); border: 1px solid var(--border); border-radius: 8px; padding: 2px 8px; user-select: all; }
  .act{ display: grid; grid-template-columns: 150px 1fr auto; gap: 12px; padding: 9px 0; border-top: 1px solid var(--border); font-size: 13px; }
  .act:first-of-type{ border-top: none; }
  .act .t{ color: var(--text-faint); }
  .act .p{ color: var(--text-muted); }
  @media (max-width: 600px){ .act{ grid-template-columns: 1fr; gap: 2px; } }
  .status{ font-size: 13px; color: var(--text-faint); min-height: 1.4em; margin: 0 0 16px; }
  .status.err{ color: var(--error); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="left">
      <a class="back" href="/"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>Toolbox</a>
      <h1>Access</h1>
    </div>
    <span class="me" id="me"></span>
  </header>
  <p class="status" id="status" role="status"></p>

  <section class="card"><div class="card-head"><h2>Requests</h2><span class="count" id="c-pending"></span></div><div id="pending"></div></section>
  <section class="card"><div class="card-head"><h2>People with access</h2><span class="count" id="c-approved"></span></div><div id="approved"></div></section>
  <section class="card"><div class="card-head"><h2>Declined or removed</h2><span class="count" id="c-denied"></span></div><div id="denied"></div></section>
  <section class="card"><div class="card-head"><h2>Recent activity</h2><span class="count">last 100 opened pages</span></div><div id="activity"></div></section>
</div>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  $('me').textContent = 'Signed in as ' + ${jsStr(me)};
  var TOOLS = { '/': 'Toolbox home', '/admin': 'Admin', '/banner-generator/': 'Social Banner Creator', '/cover-converter/': 'Cover Converter',
    '/sessions-radio-maker/': 'Sessions Asset Generator', '/thumbnail-maker/': 'Thumbnail Maker', '/song-briefing/': 'Song Briefing', '/general-briefing/': 'General Briefing' };

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
    var row = el('div', 'row'), who = el('div', 'who');
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
  }
  load();
})();
</script>
</body>
</html>`;
}

export function accountPage({ me, name, jobTitle }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${HEAD}
<title>Toolbox · Account</title>
<style>
${BASE_CSS}
  .wrap{ max-width: 520px; margin: 0 auto; padding: 40px 40px 80px; }
  @media (max-width: 600px){ .wrap{ padding: 24px 16px 60px; } }
  header{ display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
  .back{ display: inline-flex; align-items: center; gap: 6px; color: var(--text); border: 1px solid var(--border-hover); border-radius: 9999px; padding: 8px 15px; font-size: 14px; }
  .back svg{ width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2; }
  h1{ font-size: 26px; font-weight: 600; letter-spacing: -0.02em; margin: 0; }
  section{ margin-bottom: 20px; }
  h2{ font-size: 17px; font-weight: 600; margin: 0 0 4px; }
  .sub{ font-size: 14px; color: var(--text-muted); margin: 0 0 16px; line-height: 1.5; word-break: break-all; }
  form{ display: flex; flex-direction: column; gap: 12px; }
  label{ font-size: 13px; color: var(--text-muted); margin: 4px 0 -4px 20px; }
  .hint{ font-size: 12px; color: var(--text-faint); margin: -4px 0 0 20px; }
  .btn{ margin-top: 8px; }
  .msg{ font-size: 14px; line-height: 1.5; margin: 4px 0 0; min-height: 1.5em; }
  .msg.err{ color: var(--error); }
  .msg.ok{ color: var(--success); }
  .two{ display: flex; gap: 10px; }
  .two .col{ flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <a class="back" href="/"><svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M15 19l-7-7 7-7"/></svg>Toolbox</a>
    <h1>Account</h1>
  </header>

  <section class="card">
    <h2>Signed in as</h2>
    <p class="sub" id="me"></p>
    <button class="btn-utility" type="button" id="signOut">Sign out</button>
  </section>

  <section class="card">
    <h2>Profile</h2>
    <p class="sub">Shown on the Toolbox and to the admin.</p>
    <form id="nameForm" novalidate>
      <div class="two">
        <div class="col"><label for="nm-first">First name</label><input id="nm-first" type="text" autocomplete="given-name" maxlength="40" required></div>
        <div class="col"><label for="nm-last">Last name</label><input id="nm-last" type="text" autocomplete="family-name" maxlength="40" required></div>
      </div>
      <label for="nm-job">Job title</label>
      <input id="nm-job" type="text" autocomplete="organization-title" maxlength="80" required>
      <button class="btn" type="submit">Save profile</button>
      <p class="msg" id="nameMsg" role="alert"></p>
    </form>
  </section>

  <section class="card">
    <h2>Change password</h2>
    <p class="sub">You stay signed in here; other devices are signed out.</p>
    <form id="pwForm" novalidate>
      <input type="email" autocomplete="username" id="user" hidden>
      <label for="cur">Current password</label>
      <input id="cur" type="password" autocomplete="current-password" required>
      <label for="pw1">New password</label>
      <input id="pw1" type="password" autocomplete="new-password" minlength="10" required>
      <p class="hint">At least 10 characters.</p>
      <label for="pw2">New password again</label>
      <input id="pw2" type="password" autocomplete="new-password" minlength="10" required>
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
