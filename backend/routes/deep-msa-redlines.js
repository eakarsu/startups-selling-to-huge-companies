// MSA Redlines Library — deep feature for enterprise-sales-to-F100 MSA negotiation tracking.
//
// Endpoints:
//   GET  /api/deep-msa-redlines/clauses                catalog of standard MSA clauses
//   GET  /api/deep-msa-redlines/clauses/:id            single clause with redline history
//   GET  /api/deep-msa-redlines/redlines               all redlines with clause + company join
//   GET  /api/deep-msa-redlines/redlines/by-company/:companyId
//   GET  /api/deep-msa-redlines/by-topic               group redlines by topic, summarize outcomes
//   GET  /api/deep-msa-redlines/cycle-analysis        avg cycle days per topic / company
//   POST /api/deep-msa-redlines/redlines               record a redline negotiation
//   PATCH /api/deep-msa-redlines/redlines/:id          update outcome / negotiated_value

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/clauses', async (req, res) => {
  try {
    const { topic, risk_level } = req.query;
    const params = [];
    const where = [];
    if (topic)      { params.push(topic);      where.push(`topic = $${params.length}`); }
    if (risk_level) { params.push(risk_level); where.push(`risk_level = $${params.length}`); }
    const sql = `SELECT id, topic, clause_name, default_text, startup_position, risk_level, notes
                 FROM msa_clauses
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY topic, risk_level DESC, clause_name`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/clauses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const cl = await pool.query('SELECT * FROM msa_clauses WHERE id=$1', [id]);
    if (!cl.rows[0]) return res.status(404).json({ error: 'Clause not found' });
    const redlines = await pool.query(
      `SELECT r.*, c.name AS company_name, c.tier AS company_tier
       FROM msa_redlines r LEFT JOIN companies c ON c.id = r.company_id
       WHERE r.clause_id=$1
       ORDER BY r.cycle_days NULLS LAST DESC`,
      [id]
    );
    res.json({ clause: cl.rows[0], redlines: redlines.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/redlines', async (req, res) => {
  try {
    const { outcome, topic, company_id } = req.query;
    const params = [];
    const where = [];
    if (outcome)    { params.push(outcome);    where.push(`r.outcome = $${params.length}`); }
    if (topic)      { params.push(topic);      where.push(`mc.topic = $${params.length}`); }
    if (company_id) { params.push(company_id); where.push(`r.company_id = $${params.length}`); }
    const sql = `
      SELECT r.id, r.clause_id, r.company_id, r.buyer_position, r.startup_counter,
             r.outcome, r.negotiated_value, r.cycle_days, r.closed_at, r.notes,
             mc.topic, mc.clause_name, mc.risk_level,
             c.name AS company_name, c.tier AS company_tier
      FROM msa_redlines r
      JOIN msa_clauses mc ON mc.id = r.clause_id
      LEFT JOIN companies c ON c.id = r.company_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY r.id DESC`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/redlines/by-company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Invalid companyId' });
    const r = await pool.query(
      `SELECT r.*, mc.topic, mc.clause_name, mc.risk_level, mc.default_text
       FROM msa_redlines r JOIN msa_clauses mc ON mc.id = r.clause_id
       WHERE r.company_id=$1
       ORDER BY mc.topic, mc.clause_name`,
      [companyId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-topic', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT mc.topic,
             COUNT(*) FILTER (WHERE r.outcome = 'accepted') AS accepted,
             COUNT(*) FILTER (WHERE r.outcome = 'open')      AS open,
             COUNT(*) FILTER (WHERE r.outcome = 'rejected')  AS rejected,
             COUNT(*) AS total,
             ROUND(AVG(r.cycle_days)::numeric, 1) AS avg_cycle_days,
             MAX(r.cycle_days) AS max_cycle_days
      FROM msa_clauses mc LEFT JOIN msa_redlines r ON r.clause_id = mc.id
      GROUP BY mc.topic
      ORDER BY mc.topic`);
    res.json(r.rows.map(row => ({
      topic: row.topic,
      accepted: Number(row.accepted),
      open: Number(row.open),
      rejected: Number(row.rejected),
      total: Number(row.total),
      avg_cycle_days: row.avg_cycle_days ? Number(row.avg_cycle_days) : null,
      max_cycle_days: row.max_cycle_days ? Number(row.max_cycle_days) : null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/cycle-analysis', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id AS company_id, c.name AS company_name, c.tier,
             COUNT(r.id) AS redlines,
             ROUND(AVG(r.cycle_days)::numeric, 1) AS avg_cycle_days,
             COUNT(*) FILTER (WHERE r.outcome = 'open') AS open_count,
             SUM(d.value_usd) AS pipeline_value_usd
      FROM companies c
      LEFT JOIN msa_redlines r ON r.company_id = c.id
      LEFT JOIN deals d ON d.company_id = c.id AND d.stage NOT IN ('closed_won','closed_lost')
      GROUP BY c.id, c.name, c.tier
      HAVING COUNT(r.id) > 0
      ORDER BY avg_cycle_days DESC NULLS LAST`);
    res.json(r.rows.map(row => ({
      company_id: row.company_id,
      company_name: row.company_name,
      tier: row.tier,
      redlines: Number(row.redlines),
      avg_cycle_days: row.avg_cycle_days ? Number(row.avg_cycle_days) : null,
      open_count: Number(row.open_count),
      pipeline_value_usd: row.pipeline_value_usd ? Number(row.pipeline_value_usd) : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/redlines', async (req, res) => {
  try {
    const { clause_id, company_id, buyer_position, startup_counter, outcome = 'open',
            negotiated_value = null, cycle_days = null, notes = null } = req.body || {};
    if (!clause_id || !company_id) {
      return res.status(400).json({ error: 'clause_id and company_id required' });
    }
    const closed_at = (outcome === 'accepted' || outcome === 'rejected') ? new Date() : null;
    const r = await pool.query(
      `INSERT INTO msa_redlines (clause_id, company_id, buyer_position, startup_counter, outcome,
                                 negotiated_value, cycle_days, closed_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [clause_id, company_id, buyer_position, startup_counter, outcome,
       negotiated_value, cycle_days, closed_at, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/redlines/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const allowed = ['buyer_position', 'startup_counter', 'outcome', 'negotiated_value',
                     'cycle_days', 'notes'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    }
    if (req.body.outcome === 'accepted' || req.body.outcome === 'rejected') {
      params.push(new Date()); sets.push(`closed_at=$${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    params.push(id);
    const r = await pool.query(
      `UPDATE msa_redlines SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Redline not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
