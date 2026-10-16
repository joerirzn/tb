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
  /* the numbers at a glance */
  .stats{ display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px; background: var(--hairline); border: 1px solid var(--hairline); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 14px; }
  .stat{ background: var(--surface); padding: 16px 18px; text-align: left; border: none; color: inherit; font: inherit; cursor: pointer; transition: background-color .15s ease; }
  .stat:hover{ background: #191919; }
  .stat .k{ font-size: 11.5px; font-weight: 600; color: var(--faint); }
  .stat .v{ font-size: 26px; font-weight: 700; letter-spacing: -0.02em; margin-top: 2px; }
  .stat.alert .v{ color: var(--accent); }
  @media (max-width: 760px){ .stats{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }

  /* one subject at a time */
  .bar{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .tabs{ display: flex; gap: 2px; padding: 3px; border-radius: var(--radius-pill); background: var(--surface); border: 1px solid var(--border-hover); flex-wrap: wrap; }
  .tabs button{ height: 32px; border: none; background: none; border-radius: var(--radius-pill); color: var(--faint); font: 600 12.5px var(--font); padding: 0 14px; cursor: pointer; transition: color .15s, background-color .15s; }
  .tabs button:hover{ color: var(--muted); }
  .tabs button.on{ background: var(--surface-3); color: var(--text); box-shadow: inset 0 0 0 1px var(--border-hover); }
  .tabs .n{ margin-left: 6px; font-weight: 500; color: var(--faint); }
  .tabs .n.hot{ color: #fff; background: var(--accent); border-radius: 5px; padding: 0 6px; font-weight: 700; }
  .find{ margin-left: auto; width: 260px; }
  .find input{ height: 36px; border-radius: var(--radius-pill); padding: 0 14px; }
  @media (max-width: 760px){ .find{ width: 100%; margin-left: 0; } }

  .status{ font-size: 12.5px; color: var(--muted); margin: 0 0 12px; }
  .status:empty{ display: none; }
  .status.err{ color: var(--error); }
  .pwbox{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 14px; margin-bottom: 12px; border-radius: 12px; background: rgba(251, 191, 36, 0.08); border: 1px solid rgba(251, 191, 36, 0.3); font-size: 12.5px; color: var(--warning); }
  .pwbox code{ font-size: 13px; color: var(--text); background: var(--field); border: 1px solid var(--border-hover); border-radius: 8px; padding: 3px 9px; user-select: all; }
  .pwbox .btn-utility{ margin-left: auto; }

  /* tables */
  .table{ background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-lg); overflow: hidden; }
  .row{ display: grid; align-items: center; gap: 14px; padding: 11px 16px; border-top: 1px solid var(--border); font-size: 12.5px; min-width: 0; }
  .row:first-child{ border-top: none; }
  .row.head{ font-size: 11px; font-weight: 600; color: var(--faint); text-transform: uppercase; letter-spacing: .06em; padding-top: 10px; padding-bottom: 10px; background: #111; }
  .people .row{ grid-template-columns: minmax(180px, 1.4fr) minmax(160px, 1.2fr) 120px 120px 230px; }
  .acts .row{ grid-template-columns: 150px minmax(0, 1fr) 220px; }
  .row > *{ min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .who{ display: flex; align-items: center; gap: 10px; }
  .ini{ width: 30px; height: 30px; flex: none; border-radius: 9999px; background: var(--surface-3); box-shadow: inset 0 0 0 1px var(--border-hover); display: grid; place-items: center; font-size: 10.5px; font-weight: 700; }
  .who .t{ min-width: 0; }
  .who .t b{ display: block; font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
  .who .t .job{ display: block; font-size: 11.5px; color: var(--faint); overflow: hidden; text-overflow: ellipsis; }
  .badge{ font-size: 10px; font-weight: 700; color: #fff; background: var(--accent); border-radius: 5px; padding: 1px 6px; margin-left: 6px; vertical-align: 1px; }
  .muted{ color: var(--muted); }
  .faint{ color: var(--faint); }
  .actions{ display: flex; gap: 6px; justify-content: flex-end; overflow: visible; }
  .actions .btn-utility{ height: 28px; padding: 0 11px; font-size: 11.5px; }
  .actions .btn{ width: auto; height: 28px; padding: 0 14px; font-size: 11.5px; }
  .empty{ padding: 28px 16px; text-align: center; color: var(--faint); font-size: 12.5px; }
  @media (max-width: 1000px){
    .people .row{ grid-template-columns: minmax(0, 1fr) auto; }
    .people .row > .c-mail, .people .row > .c-seen, .people .row > .c-since{ display: none; }
    .people .row.head{ display: none; }
    .acts .row{ grid-template-columns: 110px minmax(0, 1fr); }
    .acts .row > .c-page{ grid-column: 2; }
  }

  /* requests: one card each, with what they need it for */
  .cards{ display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }
  .card{ background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; }
  .card .note{ font-size: 12.5px; line-height: 1.5; color: var(--muted); white-space: pre-wrap; background: var(--field); border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; margin: 0; }
  .card .meta{ font-size: 11.5px; color: var(--faint); }
  .card .actions{ justify-content: flex-start; }
  .card .actions .btn, .card .actions .btn-utility{ height: 34px; font-size: 12.5px; padding: 0 16px; }

  .intro{ font-size: 12.5px; line-height: 1.5; color: var(--faint); margin: 0 0 12px; max-width: 80ch; }
  /* write a message to everyone */
  .ann-grid{ display: grid; grid-template-columns: minmax(320px, 440px) minmax(0, 1fr); gap: 16px; align-items: start; }
  @media (max-width: 1000px){ .ann-grid{ grid-template-columns: 1fr; } }
  .composer{ background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--radius-lg); padding: 18px; }
  .composer h3{ font-size: 13px; font-weight: 700; margin: 0 0 4px; }
  .composer .sub{ font-size: 12px; color: var(--faint); margin: 0 0 14px; line-height: 1.5; }
  .composer textarea{ min-height: 110px; }
  .composer .count{ font-size: 11px; color: var(--faint); text-align: right; margin-top: 4px; }
  .composer .btn{ width: auto; padding: 0 20px; }
  .composer .msg{ margin: 10px 0 0; }
  .kind{ font-size: 10px; font-weight: 700; border-radius: 5px; padding: 1px 6px; margin-right: 6px; vertical-align: 1px; }
  .kind.update{ color: #fff; background: var(--accent); }
  .kind.tool{ color: #002616; background: var(--success); }
  .ann-body{ font-size: 12.5px; color: var(--muted); white-space: pre-wrap; margin-top: 3px; line-height: 1.5; }
  #announcements .row{ white-space: normal; }
</style>
</head>
${shellBody({ me, name, jobTitle, isAdmin: true })}
<div class="app-header">
  <h1>Access <span>· who can use the Creative Toolbox</span></h1>
</div>

<div class="stats" id="stats">
  <button class="stat" type="button" data-go="requests"><div class="k">Waiting for approval</div><div class="v" id="s-pending">–</div></button>
  <button class="stat" type="button" data-go="people"><div class="k">People with access</div><div class="v" id="s-people">–</div></button>
  <button class="stat" type="button" data-go="activity"><div class="k">Active in the last 7 days</div><div class="v" id="s-active">–</div></button>
  <button class="stat" type="button" data-go="declined"><div class="k">Declined or removed</div><div class="v" id="s-denied">–</div></button>
</div>

<div class="bar">
  <div class="tabs" role="tablist" aria-label="Show">
    <button type="button" role="tab" data-tab="requests">Requests<span class="n" id="t-pending"></span></button>
    <button type="button" role="tab" data-tab="people">People<span class="n" id="t-people"></span></button>
    <button type="button" role="tab" data-tab="declined">Declined<span class="n" id="t-denied"></span></button>
    <button type="button" role="tab" data-tab="activity">Activity</button>
    <button type="button" role="tab" data-tab="announcements">Announcements</button>
  </div>
  <div class="find" id="findWrap"><input type="search" id="find" placeholder="Search a name or email" aria-label="Search people" autocomplete="off"></div>
</div>
<p class="status" id="status" role="status"></p>
<div id="pwbox"></div>

<section data-panel="requests"><div class="cards" id="pending"></div></section>
<section data-panel="people" hidden><div class="table people" id="approved"></div></section>
<section data-panel="declined" hidden><div class="table people" id="denied"></div></section>
<section data-panel="activity" hidden><div class="table acts" id="activity"></div></section>
<section data-panel="announcements" hidden>
  <div class="ann-grid">
    <form class="composer" id="annForm" novalidate>
      <h3>Send a message to everyone</h3>
      <p class="sub">Everyone with access gets it in their notifications, e.g. about an update or a new feature. New tools are announced automatically.</p>
      <div class="field"><label for="annTitle">Title</label><input id="annTitle" type="text" maxlength="80" placeholder="e.g. Banner Creator: TikTok size added" autocomplete="off"></div>
      <div class="field"><label for="annBody">Message <span class="opt">optional</span></label><textarea id="annBody" maxlength="600" placeholder="What changed, and what does it mean for them?"></textarea><div class="count" id="annCount">0 / 600</div></div>
      <div class="field"><label for="annLink">Opens <span class="opt">when they click it</span></label><select id="annLink"></select></div>
      <button class="btn" type="submit">Send to everyone</button>
      <p class="msg" id="annMsg" role="alert"></p>
    </form>
    <div>
      <div class="table" id="announcements"></div>
    </div>
  </div>
</section>
<script>
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var mine = ${jsStr(me)};
  var TOOLS = { '/': 'Home', '/admin': 'Access', '/account': 'Account', '/banner-generator/': 'Social Banner Creator', '/cover-converter/': 'Cover Converter',
    '/sessions-radio-maker/': 'Sessions Asset Generator', '/thumbnail-maker/': 'Thumbnail Maker', '/song-briefing/': 'Song Briefing', '/general-briefing/': 'General Briefing', '/ideas/': 'Ideas' };
  var users = [], activity = [], tab = '', query = '';

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function when(t) {
    if (!t) return 'never';
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    if (m < 60 * 24) return Math.round(m / 60) + ' h ago';
    if (m < 60 * 24 * 7) return Math.round(m / 1440) + ' d ago';
    return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function initials(s) { return String(s || '').split(/[\\s@.]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('') || '·'; }
  function status(s, err) { var e = $('status'); e.textContent = s || ''; e.className = 'status' + (err ? ' err' : ''); }
  function button(text, cls, onClick) { var b = el('button', cls, text); b.type = 'button'; b.addEventListener('click', onClick); return b; }

  async function call(action, id, confirmText) {
    if (confirmText && !confirm(confirmText)) return null;
    var r = await fetch('/admin/api/' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: id }) });
    var j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { status(j.error || 'That did not work. Reload and try again.', true); return null; }
    return j;
  }

  // name, job and avatar in one cell
  function whoCell(u) {
    var c = el('div', 'who'), t = el('div', 't');
    c.appendChild(el('span', 'ini', initials(u.name || u.email)));
    var b = el('b', null, u.name || '(no name)'); if (u.is_admin) b.appendChild(el('span', 'badge', 'Admin'));
    t.appendChild(b); t.appendChild(el('span', 'job', u.job_title || '')); c.appendChild(t);
    return c;
  }
  function matches(u) { var q = query.toLowerCase(); return !q || (u.name + ' ' + u.email + ' ' + (u.job_title || '')).toLowerCase().indexOf(q) >= 0; }

  function renderRequests() {
    var box = $('pending'); box.innerHTML = '';
    var list = users.filter(function (u) { return u.status === 'pending'; });
    if (!list.length) { var e = el('div', 'table'); e.appendChild(el('div', 'empty', 'No open requests. New requests show up here.')); box.appendChild(e); return; }
    list.forEach(function (u) {
      var c = el('div', 'card');
      var top = whoCell(u); c.appendChild(top);
      c.appendChild(el('div', 'muted', u.email));
      if (u.note) c.appendChild(el('p', 'note', u.note));
      c.appendChild(el('div', 'meta', 'Requested ' + when(u.created_at)));
      var a = el('div', 'actions');
      a.appendChild(button('Accept', 'btn', async function () { if (await call('approve', u.id)) { status('Accepted ' + u.email + '. They can sign in now.'); load(); } }));
      a.appendChild(button('Decline', 'btn-utility danger', async function () { if (await call('deny', u.id, 'Decline the request from ' + u.email + '?')) { status('Declined ' + u.email + '.'); load(); } }));
      c.appendChild(a); box.appendChild(c);
    });
  }

  function peopleTable(box, list, cols, rowFor, emptyText) {
    box.innerHTML = '';
    var head = el('div', 'row head'); cols.forEach(function (c) { head.appendChild(el('div', c[0], c[1])); }); box.appendChild(head);
    if (!list.length) { box.appendChild(el('div', 'empty', emptyText)); return; }
    list.forEach(function (u) { box.appendChild(rowFor(u)); });
  }

  function renderPeople() {
    var list = users.filter(function (u) { return u.status === 'approved' && matches(u); })
      .sort(function (a, b) { return (b.last_seen_at || 0) - (a.last_seen_at || 0); });
    peopleTable($('approved'), list, [['', 'Name'], ['c-mail', 'Email'], ['c-seen', 'Last active'], ['c-since', 'Access since'], ['', '']], function (u) {
      var r = el('div', 'row');
      r.appendChild(whoCell(u));
      r.appendChild(el('div', 'c-mail muted', u.email));
      r.appendChild(el('div', 'c-seen muted', when(u.last_seen_at)));
      r.appendChild(el('div', 'c-since faint', when(u.decided_at || u.created_at)));
      var a = el('div', 'actions');
      if (u.email !== mine) {
        a.appendChild(button('Reset password', 'btn-utility', async function () {
          var j = await call('reset-password', u.id, 'Give ' + u.email + ' a new password? Their current password stops working.');
          if (!j) return;
          var box = $('pwbox'); box.innerHTML = '';
          var p = el('div', 'pwbox'); p.appendChild(el('span', null, 'New password for ' + u.email + ' (shown once, send it to them):'));
          p.appendChild(el('code', null, j.password));
          p.appendChild(button('Done', 'btn-utility', function () { box.innerHTML = ''; }));
          box.appendChild(p);
        }));
        a.appendChild(button('Remove', 'btn-utility danger', async function () { if (await call('revoke', u.id, 'Remove access for ' + u.email + '? They are signed out right away.')) { status('Removed access for ' + u.email + '.'); load(); } }));
      }
      r.appendChild(a);
      return r;
    }, query ? 'Nobody matches "' + query + '".' : 'Nobody has access yet.');
  }

  function renderDeclined() {
    var list = users.filter(function (u) { return u.status === 'denied' && matches(u); });
    peopleTable($('denied'), list, [['', 'Name'], ['c-mail', 'Email'], ['c-seen', 'Since'], ['c-since', ''], ['', '']], function (u) {
      var r = el('div', 'row');
      r.appendChild(whoCell(u));
      r.appendChild(el('div', 'c-mail muted', u.email));
      r.appendChild(el('div', 'c-seen muted', when(u.decided_at)));
      r.appendChild(el('div', 'c-since'));
      var a = el('div', 'actions');
      a.appendChild(button('Give access', 'btn-utility', async function () { if (await call('approve', u.id, 'Give ' + u.email + ' access?')) { status('Gave access to ' + u.email + '.'); load(); } }));
      a.appendChild(button('Delete', 'btn-utility danger', async function () { if (await call('delete', u.id, 'Delete ' + u.email + ' completely? They can then request access again.')) { status('Deleted ' + u.email + '.'); load(); } }));
      r.appendChild(a);
      return r;
    }, query ? 'Nobody matches "' + query + '".' : 'Nobody has been declined or removed.');
  }

  function renderActivity() {
    var box = $('activity'); box.innerHTML = '';
    var q = query.toLowerCase();
    var list = activity.filter(function (a) { return !q || ((a.name || '') + ' ' + a.email).toLowerCase().indexOf(q) >= 0; });
    var head = el('div', 'row head'); ['When', 'Who', 'Opened'].forEach(function (t) { head.appendChild(el('div', null, t)); }); box.appendChild(head);
    if (!list.length) { box.appendChild(el('div', 'empty', q ? 'No activity for "' + query + '".' : 'Nothing yet. When colleagues open the tools, it shows up here.')); return; }
    list.forEach(function (a) {
      var r = el('div', 'row');
      r.appendChild(el('div', 'faint', when(a.at)));
      r.appendChild(el('div', null, (a.name || a.email)));
      r.appendChild(el('div', 'c-page muted', TOOLS[a.path] || a.path));
      box.appendChild(r);
    });
  }

  function renderStats() {
    var pending = users.filter(function (u) { return u.status === 'pending'; }).length;
    var people = users.filter(function (u) { return u.status === 'approved'; }).length;
    var denied = users.filter(function (u) { return u.status === 'denied'; }).length;
    var week = Date.now() - 7 * 864e5;
    var active = users.filter(function (u) { return u.status === 'approved' && u.last_seen_at > week && u.email !== mine; }).length;
    $('s-pending').textContent = pending; $('s-people').textContent = people; $('s-active').textContent = active; $('s-denied').textContent = denied;
    document.querySelector('.stat[data-go="requests"]').classList.toggle('alert', pending > 0);
    $('t-pending').textContent = pending || ''; $('t-pending').className = 'n' + (pending ? ' hot' : '');
    $('t-people').textContent = people; $('t-denied').textContent = denied || '';
  }

  function show(name) {
    tab = name;
    document.querySelectorAll('.tabs button').forEach(function (b) { var on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    document.querySelectorAll('[data-panel]').forEach(function (p) { p.hidden = p.dataset.panel !== name; });
    $('findWrap').hidden = !(name === 'people' || name === 'declined' || name === 'activity');
    var panel = document.querySelector('[data-panel="' + name + '"]');
    if (window.tbIn) tbIn(panel);
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
  }
  document.querySelectorAll('.tabs button').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.tab); }); });
  document.querySelectorAll('.stat').forEach(function (b) { b.addEventListener('click', function () { show(b.dataset.go); }); });
  $('find').addEventListener('input', function () { query = this.value.trim(); renderPeople(); renderDeclined(); renderActivity(); });

  async function load() {
    var r = await fetch('/admin/api/users');
    if (!r.ok) { status('Could not load the list. Reload the page.', true); return; }
    var data = await r.json(); users = data.users; activity = data.activity;
    renderStats(); renderRequests(); renderPeople(); renderDeclined(); renderActivity();
    // first visit: open requests if there are any, otherwise the people
    if (!tab) {
      var want = location.hash.slice(1);
      show(document.querySelector('[data-panel="' + want + '"]') ? want : (users.some(function (u) { return u.status === 'pending'; }) ? 'requests' : 'people'));
    }
  }
  // the message composer
  (function () {
    var sel = $('annLink');
    [['/', 'Nothing, just the message'], ['/#time-saved', 'Time saved']].concat(Object.keys(TOOLS).filter(function (k) { return k.length > 1 && k.charAt(k.length - 1) === '/' && k !== '/ideas/'; }).map(function (k) { return [k, TOOLS[k]]; }))
      .forEach(function (o) { var e = el('option', null, o[1]); e.value = o[0]; sel.appendChild(e); });
    $('annBody').addEventListener('input', function () { $('annCount').textContent = this.value.length + ' / 600'; });
    $('annForm').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msg = $('annMsg'), btn = this.querySelector('.btn'), title = $('annTitle').value.trim();
      msg.className = 'msg'; msg.textContent = '';
      if (!title) { msg.className = 'msg err'; msg.textContent = 'Give the message a title.'; $('annTitle').focus(); return; }
      var people = users.filter(function (u) { return u.status === 'approved' && u.email !== mine; }).length;
      if (!confirm('Send "' + title + '" to ' + people + (people === 1 ? ' person' : ' people') + '?')) return;
      btn.disabled = true;
      try {
        var r = await fetch('/admin/api/announcements/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title, body: $('annBody').value.trim(), link: $('annLink').value }) });
        var j = {}; try { j = await r.json(); } catch (x) {}
        if (!r.ok) throw new Error(j.error || 'Sending failed. Try again.');
        this.reset(); $('annCount').textContent = '0 / 600';
        msg.className = 'msg ok'; msg.textContent = 'Sent to ' + j.sent + (j.sent === 1 ? ' person.' : ' people.');
        loadAnnouncements();
      } catch (err) { msg.className = 'msg err'; msg.textContent = err.message; }
      btn.disabled = false;
    });
  })();

  async function loadAnnouncements() {
    var r = await fetch('/admin/api/announcements'); if (!r.ok) return;
    var list = (await r.json()).announcements, box = $('announcements'); box.innerHTML = '';
    var head = el('div', 'row head'); head.style.gridTemplateColumns = 'minmax(0, 1fr) auto'; head.appendChild(el('div', null, 'Sent')); head.appendChild(el('div')); box.appendChild(head);
    if (!list.length) { box.appendChild(el('div', 'empty', 'Nothing sent yet.')); return; }
    list.forEach(function (a) {
      var row = el('div', 'row'); row.style.gridTemplateColumns = 'minmax(0, 1fr) auto';
      var who = el('div'); who.style.whiteSpace = 'normal';
      var t = el('div'); t.appendChild(el('span', 'kind ' + (a.kind === 'update' ? 'update' : 'tool'), a.kind === 'update' ? 'Message' : 'New tool'));
      t.appendChild(el('b', null, a.title)); who.appendChild(t);
      if (a.kind === 'update' && a.body) who.appendChild(el('div', 'ann-body', a.body));
      var opens = a.link === '/' ? '' : ' · opens ' + (a.link === '/#time-saved' ? 'Time saved' : (TOOLS[a.link] || a.link));
      who.appendChild(el('div', 'faint', when(a.created_at) + opens + ' · sent to ' + a.sent + ', read by ' + a.opened));
      var acts = el('div', 'actions');
      acts.appendChild(button('Delete', 'btn-utility danger', async function () {
        if (!confirm('Delete "' + a.title + '"? It also disappears from the notifications of everyone.')) return;
        var x = await fetch('/admin/api/announcements/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: a.id }) });
        if (x.ok) { status('Announcement deleted.'); loadAnnouncements(); } else status('Deleting failed. Reload and try again.', true);
      }));
      row.appendChild(who); row.appendChild(acts); box.appendChild(row);
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
  /* you across the top, then profile and password side by side */
  .sheet.account{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sheet.account > .wide{ grid-column: 1 / -1; }
  @media (max-width: 1000px){ .sheet.account{ grid-template-columns: 1fr; } }
  .sub{ font-size: 12.5px; line-height: 1.5; color: var(--faint); margin: -6px 0 14px; }
  .signed{ display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .signed .tb-avatar{ width: 46px; height: 46px; }
  .signed .tb-avatar span{ font-size: 14px; }
  .signed .who{ flex: 1; min-width: 0; }
  .signed .who b{ display: block; font-size: 15px; font-weight: 700; }
  .signed .who span{ display: block; font-size: 12.5px; color: var(--muted); word-break: break-all; }
  form .btn{ margin-top: 4px; width: auto; padding: 0 22px; }
</style>
</head>
${shellBody({ me, name, jobTitle, isAdmin })}
<div class="app-header">
  <h1>Account <span>· your profile and password</span></h1>
</div>

<div class="sheet account">
  <section class="sb-section wide">
    <div class="signed">
      <span class="tb-avatar"><span id="ini"></span></span>
      <span class="who"><b id="meName"></b><span id="me"></span></span>
      <button class="btn-utility" type="button" id="signOut">Sign out</button>
    </div>
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
  function showMe() {
    $('meName').textContent = name || me;
    $('me').textContent = (job ? job + ' · ' : '') + me;
    $('ini').textContent = (name || me).split(/[\\s@.]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0].toUpperCase(); }).join('');
  }
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
