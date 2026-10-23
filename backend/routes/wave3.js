'use strict';
const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');
const { filterRecords, toCsv, providerSummary } = require('../lib/wave3');

const AI_FEATURES = ['deal-health', 'pipeline-risk', 'next-step-coach'];
let ensured = false;
async function ensure() {
  if (ensured) return;
  await db.query(`CREATE TABLE IF NOT EXISTS wave3_tasks (
    id SERIAL PRIMARY KEY, tenant_id INTEGER NOT NULL, user_id INTEGER NOT NULL, title TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'open', priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
  ensured = true;
}
function clean(body, partial) {
  const out = {};
  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 300) throw Object.assign(new Error('title must be 1-300 characters'), { status: 400 });
    out.title = body.title.trim();
  }
  if (body.status !== undefined) {
    if (!['open', 'in_progress', 'done'].includes(body.status)) throw Object.assign(new Error('status must be open, in_progress, or done'), { status: 400 });
    out.status = body.status;
  }
  if (body.priority !== undefined) {
    if (!['low', 'medium', 'high'].includes(body.priority)) throw Object.assign(new Error('priority must be low, medium, or high'), { status: 400 });
    out.priority = body.priority;
  }
  if (body.notes !== undefined) out.notes = body.notes === null ? null : String(body.notes).slice(0, 2000);
  return out;
}
router.use(auth);
router.get('/tasks', async (req, res) => {
  try {
    await ensure();
    const rows = (await db.query('SELECT * FROM wave3_tasks WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 200', [req.user.tenantId, req.user.id])).rows;
    const needle = String(req.query.q || '').toLowerCase();
    res.json({ tasks: rows.filter((t) => (!req.query.status || t.status === req.query.status) && (!needle || t.title.toLowerCase().includes(needle))) });
  } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Tasks could not be loaded', code: 'WAVE3_TASKS_FAILED' }); }
});
router.post('/tasks', async (req, res) => {
  try {
    await ensure();
    const input = clean(req.body || {}, false);
    const row = (await db.query('INSERT INTO wave3_tasks (tenant_id,user_id,title,status,priority,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.tenantId, req.user.id, input.title, input.status || 'open', input.priority || 'medium', input.notes ?? null])).rows[0];
    res.status(201).json({ task: row });
  } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Task could not be created', code: 'WAVE3_TASK_CREATE_FAILED' }); }
});
router.put('/tasks/:id', async (req, res) => {
  try {
    await ensure();
    const input = clean(req.body || {}, true);
    const keys = Object.keys(input);
    if (!keys.length) return res.status(400).json({ error: 'At least one field is required', code: 'BAD_INPUT' });
    const sets = keys.map((k, i) => `${k}=$${i + 1}`).join(', ');
    const row = (await db.query(`UPDATE wave3_tasks SET ${sets}, updated_at=NOW() WHERE id=$${keys.length + 1} AND tenant_id=$${keys.length + 2} AND user_id=$${keys.length + 3} RETURNING *`,
      [...keys.map((k) => input[k]), req.params.id, req.user.tenantId, req.user.id])).rows[0];
    if (!row) return res.status(404).json({ error: 'Task not found', code: 'NOT_FOUND' });
    res.json({ task: row });
  } catch (e) { res.status(e.status || 500).json({ error: e.status ? e.message : 'Task could not be updated', code: 'WAVE3_TASK_UPDATE_FAILED' }); }
});
async function mainRecords(req) {
  return (await db.query(`SELECT d.*, c.name AS company_name FROM deals d JOIN companies c ON c.id=d.company_id AND c.tenant_id=d.tenant_id
    WHERE d.tenant_id=$1 AND d.archived_at IS NULL ORDER BY d.updated_at DESC LIMIT 200`, [req.user.tenantId])).rows;
}
router.get('/records', async (req, res) => {
  try { res.json({ records: filterRecords(await mainRecords(req), req.query) }); }
  catch { res.status(500).json({ error: 'Records could not be loaded', code: 'WAVE3_RECORDS_FAILED' }); }
});
router.get('/records/export', async (req, res) => {
  try {
    const rows = filterRecords(await mainRecords(req), req.query);
    if ((req.query.format || 'json') === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
      return res.send(toCsv(rows, ['id', 'company_name', 'title', 'value_usd', 'stage', 'probability', 'expected_close', 'next_action']));
    }
    res.setHeader('Content-Disposition', 'attachment; filename="deals.json"');
    return res.json({ records: rows });
  } catch { res.status(500).json({ error: 'Export failed', code: 'WAVE3_EXPORT_FAILED' }); }
});
for (const feature of AI_FEATURES) {
  router.post(`/ai/${feature}`, async (req, res) => {
    try { res.json(await providerSummary(feature, await mainRecords(req).catch(() => []))); }
    catch { res.status(500).json({ error: 'AI summary failed', code: 'WAVE3_AI_FAILED' }); }
  });
}
module.exports = router;
