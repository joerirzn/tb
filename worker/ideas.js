// Ideas board: people share ideas for new tools, vote on them and comment.
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
];

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
         ORDER BY i.created_at DESC`).bind(user.id).all();
      return json({ me: user.id, isAdmin: !!user.is_admin, ideas: rows.results.map(r => ({ ...r, voted: !!r.voted, mine: r.user_id === user.id })) });
    }
    if (kind === 'ideas' && id && action === 'comments') {
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
    return json({ ok: true, id: res.meta.last_row_id });
  }

  if (kind === 'ideas' && id) {
    const idea = await env.DB.prepare('SELECT id, user_id FROM ideas WHERE id = ?').bind(id).first();
    if (!idea) return json({ error: 'This idea no longer exists.' }, 404);

    if (action === 'vote') {
      const had = await env.DB.prepare('SELECT 1 FROM idea_votes WHERE idea_id = ? AND user_id = ?').bind(id, user.id).first();
      if (had) await env.DB.prepare('DELETE FROM idea_votes WHERE idea_id = ? AND user_id = ?').bind(id, user.id).run();
      else await env.DB.prepare('INSERT INTO idea_votes (idea_id, user_id) VALUES (?, ?)').bind(id, user.id).run();
      const n = await env.DB.prepare('SELECT COUNT(*) AS n FROM idea_votes WHERE idea_id = ?').bind(id).first();
      return json({ ok: true, voted: !had, votes: n.n });
    }
    if (action === 'comments') {
      if (!(await allow(env, 'comment:' + user.id, 30, 60))) return json({ error: 'You commented a lot in a short time. Try again in an hour.' }, 429);
      const text = clean(body.body, 1000);
      if (!text) return json({ error: 'Write a comment first.' }, 400);
      await env.DB.prepare('INSERT INTO idea_comments (idea_id, user_id, body, created_at) VALUES (?, ?, ?, ?)').bind(id, user.id, text, Date.now()).run();
      return json({ ok: true });
    }
    if (action === 'status') {
      if (!user.is_admin) return json({ error: 'Only the admin can change the status.' }, 403);
      if (!STATUSES.includes(body.status)) return json({ error: 'Unknown status.' }, 400);
      await env.DB.prepare('UPDATE ideas SET status = ? WHERE id = ?').bind(body.status, id).run();
      return json({ ok: true });
    }
    if (action === 'delete') {
      if (idea.user_id !== user.id && !user.is_admin) return json({ error: 'You can only delete your own ideas.' }, 403);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM idea_votes WHERE idea_id = ?').bind(id),
        env.DB.prepare('DELETE FROM idea_comments WHERE idea_id = ?').bind(id),
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
