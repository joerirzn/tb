// Ideas: people suggest a tool (or an improvement) to the admin. A suggestion is private:
// only its author and the admin see it, and its comments are a conversation between the two.
// Only the admin sets the status; authors can delete their own ideas and comments.

import { json, readJson, sameOrigin, allow } from './index.js';

export const IDEAS_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS ideas (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     title TEXT NOT NULL,
     body TEXT NOT NULL DEFAULT '',
     status TEXT NOT NULL DEFAULT 'new',          -- new | planned | in-progress | done | declined
     created_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS idea_votes (
     idea_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     PRIMARY KEY (idea_id, user_id)
   )`,
  `CREATE TABLE IF NOT EXISTS idea_comments (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     idea_id INTEGER NOT NULL,
     user_id INTEGER NOT NULL,
     body TEXT NOT NULL,
     created_at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idea_comments_idea ON idea_comments (idea_id)`,
  `CREATE TABLE IF NOT EXISTS notifications (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,                    -- who gets it
     actor_id INTEGER NOT NULL,                   -- who did it
     type TEXT NOT NULL,                          -- vote | comment | reply | status | idea
     idea_id INTEGER NOT NULL,
     detail TEXT NOT NULL DEFAULT '',             -- comment snippet or new status
     created_at INTEGER NOT NULL,
     read_at INTEGER
   )`,
  `CREATE INDEX IF NOT EXISTS notifications_user ON notifications (user_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS known_tools (
     path TEXT PRIMARY KEY,
     seen_at INTEGER NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS announcements (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     kind TEXT NOT NULL,                          -- tool | update
     title TEXT NOT NULL,
     body TEXT NOT NULL DEFAULT '',
     link TEXT NOT NULL DEFAULT '/',
     created_at INTEGER NOT NULL
   )`,
];

// ---------- announcements: everyone hears about a new tool on the Toolbox home ----------
// stored as a notification of type 'announce' whose idea_id holds the announcement id

// the tools everyone can open, read from the launcher cards (admin-only and "coming soon" cards are left out)
function launcherTools(html) {
  const text = s => s.replace(/<span class="card-badge">[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, "'").replace(/\s+/g, ' ').trim();
  const tools = [];
  for (const m of html.matchAll(/<a class="card[^"]*" href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)) {
    if (/data-admin-only/.test(m[2])) continue;
    const title = m[3].match(/<p class="card-title">([\s\S]*?)<\/p>/), desc = m[3].match(/<p class="card-desc">([\s\S]*?)<\/p>/);
    if (!title) continue;
    tools.push({ path: '/' + m[1].replace(/^\.?\//, ''), title: text(title[1]), desc: desc ? text(desc[1]) : '' });
  }
  return tools;
}

// once in a while: a launcher card nobody has been told about yet is announced to everyone.
// The very first run only remembers the tools that are already there.
let lastToolCheck = 0;
export async function syncTools(env, origin) {
  if (Date.now() - lastToolCheck < 5 * 60000) return;
  lastToolCheck = Date.now();
  const res = await env.ASSETS.fetch(new Request(origin + '/index.html'));
  if (!res.ok) return;
  const tools = launcherTools(await res.text());
  if (!tools.length) return;
  const known = await env.DB.prepare('SELECT COUNT(*) AS n FROM known_tools').first();
  const firstRun = known.n === 0, now = Date.now();
  for (const t of tools) {
    const r = await env.DB.prepare('INSERT OR IGNORE INTO known_tools (path, seen_at) VALUES (?, ?)').bind(t.path, now).run();
    if (r.meta.changes === 1 && !firstRun) await announce(env, { id: 0 }, { kind: 'tool', title: t.title, body: t.desc, link: t.path });
  }
}

export async function listAnnouncements(env) {
  const rows = await env.DB.prepare(
    `SELECT a.*, (SELECT COUNT(*) FROM notifications n WHERE n.type = 'announce' AND n.idea_id = a.id) AS sent,
            (SELECT COUNT(*) FROM notifications n WHERE n.type = 'announce' AND n.idea_id = a.id AND n.read_at IS NOT NULL) AS opened
     FROM announcements a ORDER BY a.created_at DESC LIMIT 20`).all();
  return rows.results;
}

export async function announce(env, me, body) {
  const kind = body.kind === 'update' ? 'update' : 'tool';
  const title = clean(body.title, 80).replace(/\n/g, ' '), text = clean(body.body, 200).replace(/\n/g, ' ');
  let link = String(body.link || '/').trim();
  if (!link.startsWith('/') || link.startsWith('//')) link = '/';
  if (!title) return { error: 'Give the announcement a title, e.g. the name of the tool.' };
  const now = Date.now();
  const res = await env.DB.prepare('INSERT INTO announcements (kind, title, body, link, created_at) VALUES (?, ?, ?, ?, ?)').bind(kind, title, text, link.slice(0, 200), now).run();
  const people = await env.DB.prepare("SELECT id FROM users WHERE status = 'approved'").all();
  await notify(env, people.results.map(p => p.id), me.id, 'announce', res.meta.last_row_id);
  return { ok: true, sent: people.results.filter(p => p.id !== me.id).length };
}

export async function deleteAnnouncement(env, id) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM notifications WHERE type = 'announce' AND idea_id = ?").bind(id),
    env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(id),
  ]);
}

// ---------- notifications ----------

export async function notify(env, recipients, actorId, type, ideaId, detail = '') {
  const now = Date.now();
  const to = [...new Set(recipients)].filter(id => id && id !== actorId);   // never notify yourself
  if (!to.length) return;
  await env.DB.batch(to.map(uid => env.DB.prepare('INSERT INTO notifications (user_id, actor_id, type, idea_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(uid, actorId, type, ideaId, String(detail).slice(0, 140), now)));
}

export async function handleNotifications(request, env, url, user) {
  if (request.method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT n.id, n.type, n.idea_id, n.detail, n.created_at, n.read_at, a.name AS actor,
              CASE WHEN n.type = 'announce' THEN NULL ELSE i.title END AS idea_title,
              an.kind AS ann_kind, an.title AS ann_title, an.body AS ann_body, an.link AS ann_link
       FROM notifications n
         LEFT JOIN users a ON a.id = n.actor_id
         LEFT JOIN ideas i ON i.id = n.idea_id AND n.type != 'announce'
         LEFT JOIN announcements an ON an.id = n.idea_id AND n.type = 'announce'
       WHERE n.user_id = ? ORDER BY n.created_at DESC LIMIT 30`).bind(user.id).all();
    const unread = await env.DB.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND read_at IS NULL').bind(user.id).first();
    return json({ unread: unread.n, items: rows.results.map(r => ({ ...r, read: !!r.read_at })) });
  }
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!sameOrigin(request, url)) return json({ error: 'Bad request.' }, 403);
  const body = await readJson(request), now = Date.now();
  if (body.id) await env.DB.prepare('UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ? AND read_at IS NULL').bind(now, Number(body.id), user.id).run();
  else await env.DB.batch([
    env.DB.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').bind(now, user.id),
    env.DB.prepare('DELETE FROM notifications WHERE created_at < ?').bind(now - 90 * 864e5),
  ]);
  return json({ ok: true });
}

const STATUSES = ['new', 'planned', 'in-progress', 'done', 'declined'];
const clean = (v, max) => String(v || '').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);

export async function handleIdeas(request, env, url, user) {
  const parts = url.pathname.split('/').filter(Boolean);    // api, ideas | comments, [id], [action]
  const kind = parts[1], id = Number(parts[2]) || 0, action = parts[3] || '';

  // ---- reading ----
  if (request.method === 'GET') {
    if (kind === 'ideas' && !id) {
      const rows = await env.DB.prepare(
        `SELECT i.id, i.title, i.body, i.status, i.created_at, i.user_id,
                u.name AS author, u.job_title AS author_job,
                (SELECT COUNT(*) FROM idea_votes v WHERE v.idea_id = i.id) AS votes,
                (SELECT COUNT(*) FROM idea_votes v WHERE v.idea_id = i.id AND v.user_id = ?) AS voted,
                (SELECT COUNT(*) FROM idea_comments c WHERE c.idea_id = i.id) AS comments
         FROM ideas i LEFT JOIN users u ON u.id = i.user_id
         WHERE ? = 1 OR i.user_id = ?
         ORDER BY i.created_at DESC`).bind(user.id, user.is_admin ? 1 : 0, user.id).all();
      return json({ me: user.id, isAdmin: !!user.is_admin, ideas: rows.results.map(r => ({ ...r, voted: !!r.voted, mine: r.user_id === user.id })) });
    }
    if (kind === 'ideas' && id && action === 'comments') {
      const idea = await env.DB.prepare('SELECT user_id FROM ideas WHERE id = ?').bind(id).first();
      if (!idea || (!user.is_admin && idea.user_id !== user.id)) return json({ error: 'This idea no longer exists.' }, 404);
      const rows = await env.DB.prepare(
        `SELECT c.id, c.body, c.created_at, c.user_id, u.name AS author, u.job_title AS author_job
         FROM idea_comments c LEFT JOIN users u ON u.id = c.user_id
         WHERE c.idea_id = ? ORDER BY c.created_at ASC`).bind(id).all();
      return json({ comments: rows.results.map(r => ({ ...r, mine: r.user_id === user.id })) });
    }
    return json({ error: 'Not found' }, 404);
  }

  // ---- writing ----
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!sameOrigin(request, url)) return json({ error: 'Bad request.' }, 403);
  const body = await readJson(request);

  if (kind === 'ideas' && !id) {
    if (!(await allow(env, 'idea:' + user.id, 10, 60))) return json({ error: 'You shared a lot of ideas in a short time. Try again in an hour.' }, 429);
    const title = clean(body.title, 120).replace(/\n/g, ' '), text = clean(body.body, 2000);
    if (!title) return json({ error: 'Give your idea a title.' }, 400);
    const res = await env.DB.prepare('INSERT INTO ideas (user_id, title, body, created_at) VALUES (?, ?, ?, ?)').bind(user.id, title, text, Date.now()).run();
    await env.DB.prepare('INSERT OR IGNORE INTO idea_votes (idea_id, user_id) VALUES (?, ?)').bind(res.meta.last_row_id, user.id).run();   // your own idea starts with your vote
    const admins = await env.DB.prepare("SELECT id FROM users WHERE is_admin = 1 AND status = 'approved'").all();
    await notify(env, admins.results.map(a => a.id), user.id, 'idea', res.meta.last_row_id);
    return json({ ok: true, id: res.meta.last_row_id });
  }

  if (kind === 'ideas' && id) {
    const idea = await env.DB.prepare('SELECT id, user_id FROM ideas WHERE id = ?').bind(id).first();
    // someone else's suggestion does not exist for you (the admin sees them all)
    if (!idea || (!user.is_admin && idea.user_id !== user.id)) return json({ error: 'This idea no longer exists.' }, 404);

    if (action === 'vote') {
      const had = await env.DB.prepare('SELECT 1 FROM idea_votes WHERE idea_id = ? AND user_id = ?').bind(id, user.id).first();
      if (had) {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM idea_votes WHERE idea_id = ? AND user_id = ?').bind(id, user.id),
          // a vote taken back also takes back its unread notification
          env.DB.prepare("DELETE FROM notifications WHERE type = 'vote' AND idea_id = ? AND actor_id = ? AND read_at IS NULL").bind(id, user.id),
        ]);
      } else {
        await env.DB.prepare('INSERT INTO idea_votes (idea_id, user_id) VALUES (?, ?)').bind(id, user.id).run();
        await notify(env, [idea.user_id], user.id, 'vote', id);
      }
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM idea_votes WHERE idea_id = ?').bind(id).first();
      return json({ ok: true, voted: !had, votes: n.n });
    }
    if (action === 'comments') {
      if (!(await allow(env, 'comment:' + user.id, 30, 60))) return json({ error: 'You commented a lot in a short time. Try again in an hour.' }, 429);
      const text = clean(body.body, 1000);
      if (!text) return json({ error: 'Write a comment first.' }, 400);
      await env.DB.prepare('INSERT INTO idea_comments (idea_id, user_id, body, created_at) VALUES (?, ?, ?, ?)').bind(id, user.id, text, Date.now()).run();
      // a conversation between the author and the admin: the other side hears about it
      const admins = await env.DB.prepare("SELECT id FROM users WHERE is_admin = 1 AND status = 'approved'").all();
      await notify(env, [idea.user_id, ...admins.results.map(a => a.id)], user.id, 'comment', id, text);
      return json({ ok: true });
    }
    if (action === 'status') {
      if (!user.is_admin) return json({ error: 'Only the admin can change the status.' }, 403);
      if (!STATUSES.includes(body.status)) return json({ error: 'Unknown status.' }, 400);
      await env.DB.prepare('UPDATE ideas SET status = ? WHERE id = ?').bind(body.status, id).run();
      await notify(env, [idea.user_id], user.id, 'status', id, body.status);
      return json({ ok: true });
    }
    if (action === 'delete') {
      if (idea.user_id !== user.id && !user.is_admin) return json({ error: 'You can only delete your own ideas.' }, 403);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM idea_votes WHERE idea_id = ?').bind(id),
        env.DB.prepare('DELETE FROM idea_comments WHERE idea_id = ?').bind(id),
        env.DB.prepare('DELETE FROM notifications WHERE idea_id = ?').bind(id),
        env.DB.prepare('DELETE FROM ideas WHERE id = ?').bind(id),
      ]);
      return json({ ok: true });
    }
  }

  if (kind === 'comments' && id && action === 'delete') {
    const c = await env.DB.prepare('SELECT user_id FROM idea_comments WHERE id = ?').bind(id).first();
    if (!c) return json({ error: 'This comment no longer exists.' }, 404);
    if (c.user_id !== user.id && !user.is_admin) return json({ error: 'You can only delete your own comments.' }, 403);
    await env.DB.prepare('DELETE FROM idea_comments WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }

  return json({ error: 'Not found' }, 404);
}
