// Time saved: every tool reports a successful export (how many files, how long someone actively worked).
// Rule of thumb: every minute of active work in a tool counts as four minutes saved.
// At most 30 minutes of work count per export.

import { json, readJson, sameOrigin, allow } from './index.js';
import { notify } from './ideas.js';

export const USAGE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS usage (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
     tool TEXT NOT NULL,
     items INTEGER NOT NULL,
     seconds INTEGER NOT NULL,
     at INTEGER NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS usage_at ON usage (at)`,
  `CREATE TABLE IF NOT EXISTS milestones (
     hours INTEGER PRIMARY KEY,
     at INTEGER NOT NULL
   )`,
];

// hours of time saved that are celebrated with a notification for everyone
export const MILESTONES = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];

const FACTOR = 4;              // minutes saved per minute in the tool
const MAX_SECONDS = 30 * 60;   // per export

export const TOOLS = {
  '/banner-generator/': 'Social Banner Creator',
  '/cover-converter/': 'Cover Converter',
  '/sessions-radio-maker/': 'Sessions Asset Generator',
  '/thumbnail-maker/': 'Thumbnail Maker',
  '/song-briefing/': 'Song Briefing',
  '/general-briefing/': 'General Briefing',
};
const TZ = 'Europe/Amsterdam';

// POST /api/usage  { tool: '/banner-generator/', items: 7, seconds: 140 }
export async function handleUsage(request, env, url, user) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (!sameOrigin(request, url)) return json({ error: 'Bad request.' }, 403);
  if (!(await allow(env, 'usage:' + user.id, 200, 60))) return json({ error: 'Too many exports.' }, 429);
  const body = await readJson(request);
  const tool = String(body.tool || '');
  if (!TOOLS[tool]) return json({ error: 'Unknown tool.' }, 400);
  const items = Math.max(1, Math.min(500, Math.round(Number(body.items) || 1)));
  const seconds = Math.max(0, Math.min(4 * 3600, Math.round(Number(body.seconds) || 0)));
  await env.DB.prepare('INSERT INTO usage (user_id, tool, items, seconds, at) VALUES (?, ?, ?, ?, ?)').bind(user.id, tool, items, seconds, Date.now()).run();
  await checkMilestones(env);
  return json({ ok: true });
}

// time spent = active minutes in the tool (the same capped minutes the saving is based on)
const spentMinutes = row => Math.min(row.seconds, MAX_SECONDS) / 60;
const savedMinutes = row => spentMinutes(row) * FACTOR;

// a milestone that was just passed is announced to everyone once (the INSERT OR IGNORE makes sure of "once")
async function checkMilestones(env) {
  const r = await env.DB.prepare('SELECT SUM(MIN(seconds, ?)) AS s FROM usage').bind(MAX_SECONDS).first();
  const savedHours = (r.s || 0) / 3600 * FACTOR;
  for (const h of MILESTONES.filter(h => h <= savedHours)) {
    const ins = await env.DB.prepare('INSERT OR IGNORE INTO milestones (hours, at) VALUES (?, ?)').bind(h, Date.now()).run();
    if (ins.meta.changes === 1) {
      const people = await env.DB.prepare("SELECT id FROM users WHERE status = 'approved'").all();
      await notify(env, people.results.map(p => p.id), 0, 'milestone', 0, String(h));
    }
  }
}

// GET /api/stats?period=24h|week|month|year|all: the numbers for one period, for the whole team.
// The milestone and the calendar always use all time, so those come along in every answer.
const PERIODS = { '24h': 864e5, week: 7 * 864e5, month: 30 * 864e5, year: 365 * 864e5 };

export async function handleStats(env, url) {
  const period = PERIODS[url.searchParams.get('period')] ? url.searchParams.get('period') : 'all';
  const rows = (await env.DB.prepare('SELECT tool, items, seconds, at FROM usage ORDER BY at').all()).results;
  const out = { preview: false, period, total: { minutes: 0, spent: 0, exports: 0, since: null }, previous: null,
    series: [], unit: period === '24h' ? 'hour' : (period === 'week' || period === 'month') ? 'day' : 'month',
    byTool: {}, allTime: { minutes: 0 }, days: {} };
  if (!rows.length) return json(out);

  const now = Date.now(), from = period === 'all' ? 0 : now - PERIODS[period];
  const fmt = o => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...o });
  const dayKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' }), dayKeyCA = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const monthKey = fmt({ year: 'numeric', month: '2-digit' }), hourKey = fmt({ year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
  const yearAgo = now - 371 * 864e5;

  // buckets for the chart, oldest first, empty ones included
  const buckets = [], index = new Map();
  const add = (key, label) => { index.set(key, buckets.length); buckets.push([label, 0]); };
  if (period === '24h') {
    for (let i = 23; i >= 0; i--) { const d = new Date(now - i * 36e5); add(hourKey.format(d), fmt({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d).replace(/:\d\d$/, ':00')); }
  } else if (period === 'week' || period === 'month') {
    const n = period === 'week' ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) { const d = new Date(now - i * 864e5); add(dayKey.format(d), period === 'week' ? fmt({ weekday: 'short' }).format(d) : fmt({ day: 'numeric', month: 'short' }).format(d).replace('Sept', 'Sep')); }
  } else {
    // months: the last 12, or every month since the first export
    const first = period === 'year' ? new Date(now - 334 * 864e5) : new Date(rows[0].at);
    let y = Number(fmt({ year: 'numeric' }).format(first)), m = Number(fmt({ month: 'numeric' }).format(first));
    const endKey = monthKey.format(new Date(now));
    for (let guard = 0; guard < 240; guard++) {
      const key = String(m).padStart(2, '0') + '/' + y;
      add(key, new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(Date.UTC(y, m - 1, 15))));
      if (key === endKey) break;
      if (++m > 12) { m = 1; y++; }
    }
  }
  const bucketOf = d => period === '24h' ? hourKey.format(d) : (period === 'week' || period === 'month') ? dayKey.format(d) : monthKey.format(d);

  let prevMinutes = 0;
  for (const r of rows) {
    const saved = savedMinutes(r), d = new Date(r.at);
    out.allTime.minutes += saved;
    if (r.at >= yearAgo) { const k = dayKeyCA.format(d); out.days[k] = (out.days[k] || 0) + saved; }
    if (period !== 'all' && r.at >= from - (now - from) && r.at < from) prevMinutes += saved;   // the period before, for the comparison
    if (r.at < from) continue;
    out.total.minutes += saved;
    out.total.spent += spentMinutes(r);
    out.total.exports += r.items;
    out.byTool[r.tool] = (out.byTool[r.tool] || 0) + saved;
    const i = index.get(bucketOf(d)); if (i !== undefined) buckets[i][1] += saved;
  }
  out.series = buckets.map(([l, v]) => [l, Math.round(v)]);
  if (period !== 'all') out.previous = { minutes: Math.round(prevMinutes) };
  out.total.minutes = Math.round(out.total.minutes);
  out.total.spent = Math.round(out.total.spent);
  out.allTime.minutes = Math.round(out.allTime.minutes);
  for (const k in out.byTool) out.byTool[k] = Math.round(out.byTool[k]);
  for (const k in out.days) out.days[k] = Math.round(out.days[k]);
  out.total.since = fmt({ month: 'long', year: 'numeric' }).format(new Date(rows[0].at));
  out.months = out.series.length;   // number of months in an all-time answer (for the average)
  return json(out);
}
