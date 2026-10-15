// Toolbox gatekeeper: every request passes here before any file is served.
// Only signed-in people whose access request was accepted get the Toolbox;
// everyone else only sees the login page.
//
// Storage: D1 database (binding DB). The admin is whoever registers with the
// ADMIN_EMAIL secret (set in the Cloudflare dashboard, never in this repo).

import { loginPage, adminPage } from './pages.js';

const SESSION_COOKIE = '__Host-tb_session';
const SESSION_DAYS = 30;
const PBKDF2_ITERATIONS = 100000;          // the maximum Workers allows
const MIN_PASSWORD = 10;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     email TEXT NOT NULL UNIQUE,
     name TEXT NOT NULL DEFAULT '',
     note TEXT NOT NULL DEFAULT '',
     pw_hash TEXT NOT NULL,
     pw_salt TEXT NOT NULL,
     status TEXT NOT NULL DEFAULT 'pending',      -- pending | approved | denied
     is_admin INTEGER NOT NULL DEFAULT 0,
     created_at INTEGER NOT NULL,
     decided_at INTEGER,
     last_login_at INTEGER,
     last_seen_at INTEGER
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token_hash TEXT PRIMARY KEY,
     user_id INTEGER NOT NULL,
     created_at INTEGER NOT NULL,
     expires_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS attempts (
     key TEXT PRIMARY KEY,
     count INTEGER NOT NULL,
     window_start INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS activity (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     path TEXT NOT NULL,
     at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS activity_at ON activity (at)`,
];

let schemaReady = null;
function ensureSchema(env) {
  if (!schemaReady) schemaReady = env.DB.batch(SCHEMA.map(s => env.DB.prepare(s))).catch(e => { schemaReady = null; throw e; });
  return schemaReady;
}

export default {
  async fetch(request, env, ctx) {
    if (!env.DB) return new Response('Toolbox is not configured yet (database missing).', { status: 500 });
    await ensureSchema(env);

    const url = new URL(request.url);
    const path = url.pathname;
    const user = await currentUser(request, env);

    // ---- sign-in, request access, sign-out ----
    if (path === '/login') {
      if (user && user.status === 'approved') return redirect(safeNext(url.searchParams.get('next')));
      return html(loginPage({ next: safeNext(url.searchParams.get('next')) }));
    }
    if (path === '/favicon.png') return env.ASSETS.fetch(request);
    if (path.startsWith('/auth/')) return handleAuth(request, env, url, user);

    // ---- everything below needs an accepted account ----
    if (!user || user.status !== 'approved') {
      if (isNavigation(request)) return redirect('/login' + (path !== '/' ? '?next=' + encodeURIComponent(path + url.search) : ''));
      return new Response('Sign in required', { status: 401, headers: { 'Cache-Control': 'no-store' } });
    }

    if (path === '/admin' || path === '/admin/') {
      if (!user.is_admin) return redirect('/');
      return html(adminPage({ me: user.email }));
    }
    if (path.startsWith('/admin/api/')) {
      if (!user.is_admin) return json({ error: 'Not allowed.' }, 403);
      return handleAdmin(request, env, url, user);
    }

    // a tool or the launcher was opened: remember who used what
    if (isNavigation(request)) ctx.waitUntil(logActivity(env, user, path));

    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'private, no-cache');
    return out;
  }
};

// ---------- auth endpoints ----------

async function handleAuth(request, env, url, user) {
  const path = url.pathname;

  if (path === '/auth/me' && request.method === 'GET') {
    if (!user || user.status !== 'approved') return json({ error: 'Sign in required' }, 401);
    return json({ email: user.email, name: user.name, isAdmin: !!user.is_admin });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!sameOrigin(request, url)) return json({ error: 'Bad request.' }, 403);

  if (path === '/auth/logout') {
    const token = getCookie(request, SESSION_COOKIE);
    if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });
  }

  const body = await readJson(request);
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const email = normEmail(body.email);
  const password = String(body.password || '');

  if (path === '/auth/login') {
    if (!(await allow(env, 'login-ip:' + ip, 20, 15)) || !(await allow(env, 'login-email:' + email, 10, 15))) {
      return json({ error: 'Too many attempts. Wait 15 minutes and try again.' }, 429);
    }
    const u = email ? await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first() : null;
    // always hash, so a wrong email takes as long as a wrong password
    const ok = await checkPassword(password, u ? u.pw_salt : 'AAAAAAAAAAAAAAAAAAAAAA==', u ? u.pw_hash : '');
    if (!u || !ok) return json({ error: 'Wrong email or password.' }, 401);
    if (u.status === 'pending') return json({ error: 'Your access request is waiting for approval. You can sign in once it has been accepted.' }, 403);
    if (u.status !== 'approved') return json({ error: 'You do not have access to the Toolbox.' }, 403);
    return startSession(env, u, body.next);
  }

  if (path === '/auth/register') {
    if (!(await allow(env, 'register-ip:' + ip, 5, 60))) return json({ error: 'Too many requests. Try again in an hour.' }, 429);
    const name = String(body.name || '').trim().slice(0, 80);
    const note = String(body.note || '').trim().slice(0, 500);
    if (!name) return json({ error: 'Fill in your name.' }, 400);
    if (!validEmail(email)) return json({ error: 'Fill in a valid email address.' }, 400);
    if (password.length < MIN_PASSWORD) return json({ error: 'Use a password of at least ' + MIN_PASSWORD + ' characters.' }, 400);
    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return json({ error: 'This email already has an account or a request. Sign in instead, or ask the admin to reset your password.' }, 409);

    const isAdmin = !!env.ADMIN_EMAIL && email === normEmail(env.ADMIN_EMAIL);
    const { hash, salt } = await hashPassword(password);
    const now = Date.now();
    const res = await env.DB.prepare('INSERT INTO users (email, name, note, pw_hash, pw_salt, status, is_admin, created_at, decided_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(email, name, note, hash, salt, isAdmin ? 'approved' : 'pending', isAdmin ? 1 : 0, now, isAdmin ? now : null).run();
    if (isAdmin) {
      const u = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(res.meta.last_row_id).first();
      return startSession(env, u, body.next);
    }
    return json({ ok: true, pending: true });
  }

  return new Response('Not found', { status: 404 });
}

async function startSession(env, u, next) {
  const token = randomToken();
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(token), u.id, now, now + SESSION_DAYS * 864e5),
    env.DB.prepare('UPDATE users SET last_login_at = ?, last_seen_at = ? WHERE id = ?').bind(now, now, u.id),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
  ]);
  return json({ ok: true, next: safeNext(next) }, 200, {
    'Set-Cookie': `${SESSION_COOKIE}=${token}; Path=/; Max-Age=${SESSION_DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`
  });
}

async function currentUser(request, env) {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .bind(await sha256(token), Date.now()).first();
}

// ---------- admin endpoints ----------

async function handleAdmin(request, env, url, me) {
  const action = url.pathname.slice('/admin/api/'.length);

  if (action === 'users' && request.method === 'GET') {
    const users = await env.DB.prepare('SELECT id, email, name, note, status, is_admin, created_at, decided_at, last_login_at, last_seen_at FROM users ORDER BY created_at DESC').all();
    const activity = await env.DB.prepare('SELECT a.path, a.at, u.name, u.email FROM activity a JOIN users u ON u.id = a.user_id ORDER BY a.at DESC LIMIT 100').all();
    return json({ users: users.results, activity: activity.results });
  }

  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!sameOrigin(request, url)) return json({ error: 'Bad request.' }, 403);
  const body = await readJson(request);
  const id = Number(body.id);
  const target = id ? await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first() : null;
  if (!target) return json({ error: 'Person not found.' }, 404);
  if (target.id === me.id) return json({ error: 'You cannot change your own account here.' }, 400);
  const now = Date.now();

  if (action === 'approve') {
    await env.DB.prepare("UPDATE users SET status = 'approved', decided_at = ? WHERE id = ?").bind(now, id).run();
    return json({ ok: true });
  }
  if (action === 'deny' || action === 'revoke') {
    await env.DB.batch([
      env.DB.prepare("UPDATE users SET status = 'denied', decided_at = ? WHERE id = ?").bind(now, id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ]);
    return json({ ok: true });
  }
  if (action === 'delete') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
      env.DB.prepare('DELETE FROM activity WHERE user_id = ?').bind(id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id),
    ]);
    return json({ ok: true });
  }
  if (action === 'reset-password') {
    const password = tempPassword();
    const { hash, salt } = await hashPassword(password);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET pw_hash = ?, pw_salt = ? WHERE id = ?').bind(hash, salt, id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id),
    ]);
    return json({ ok: true, password });
  }
  return new Response('Not found', { status: 404 });
}

async function logActivity(env, user, path) {
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO activity (user_id, path, at) VALUES (?, ?, ?)').bind(user.id, path.slice(0, 200), now),
    env.DB.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').bind(now, user.id),
    env.DB.prepare('DELETE FROM activity WHERE at < ?').bind(now - 90 * 864e5),
  ]);
}

// ---------- rate limiting: max `limit` tries per `minutes` per key ----------

async function allow(env, key, limit, minutes) {
  const now = Date.now(), win = minutes * 60000;
  const row = await env.DB.prepare('SELECT count, window_start FROM attempts WHERE key = ?').bind(key).first();
  if (!row || now - row.window_start > win) {
    await env.DB.prepare('INSERT OR REPLACE INTO attempts (key, count, window_start) VALUES (?, 1, ?)').bind(key, now).run();
    return true;
  }
  if (row.count >= limit) return false;
  await env.DB.prepare('UPDATE attempts SET count = count + 1 WHERE key = ?').bind(key).run();
  return true;
}

// ---------- passwords and tokens ----------

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function pbkdf2(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
}
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: b64(await pbkdf2(password, salt)), salt: b64(salt) };
}
async function checkPassword(password, salt, expected) {
  const got = b64(await pbkdf2(password, unb64(salt)));
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
async function sha256(s) { return b64(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))); }
function randomToken() { return b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function tempPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(14)), b => chars[b % chars.length]).join('');
}

// ---------- small helpers ----------

function normEmail(s) { return String(s || '').trim().toLowerCase(); }
function validEmail(s) { return /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[^\s@<>"'`]+$/.test(s) && s.length <= 200; }
function safeNext(n) { n = String(n || '/'); return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/'; }
function isNavigation(request) {
  const mode = request.headers.get('Sec-Fetch-Mode');
  if (mode) return mode === 'navigate';
  return request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html');
}
function sameOrigin(request, url) { return request.headers.get('Origin') === url.origin; }
function getCookie(request, name) {
  const m = (request.headers.get('Cookie') || '').match(new RegExp('(?:^|;\\s*)' + name.replace(/[-]/g, '\\-') + '=([^;]+)'));
  return m ? m[1] : null;
}
function clearCookie() { return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`; }
async function readJson(request) { try { return await request.json(); } catch (e) { return {}; } }
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
}
function html(body) {
  return new Response(body, { headers: {
    'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY', 'Referrer-Policy': 'same-origin'
  } });
}
function redirect(to) { return new Response(null, { status: 302, headers: { Location: to, 'Cache-Control': 'no-store' } }); }
