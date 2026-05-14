// Compliance Posture Tracker — deep feature for SOC 2 / ISO 27001 / HIPAA / FedRAMP / IRAP / C5 tracking.
//
// Endpoints:
//   GET  /api/deep-compliance-posture/certifications      list certifications
//   GET  /api/deep-compliance-posture/gap-vs-deals       which frameworks block which deals
//   GET  /api/deep-compliance-posture/cost-vs-revenue    cost-to-acquire vs pipeline value unlocked
//   GET  /api/deep-compliance-posture/expiring           certifications expiring within N days
//   GET  /api/deep-compliance-posture/by-deal/:dealId    compliance requirements for a deal
//   POST /api/deep-compliance-posture/certifications     add a certification
//   POST /api/deep-compliance-posture/deal-requirements add a deal requirement
//   PATCH /api/deep-compliance-posture/certifications/:id

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

router.get('/certifications', async (req, res) => {
  try {
    const { status, framework } = req.query;
    const params = [];
    const where = [];
    if (status)    { params.push(status);    where.push(`status = $${params.length}`); }
    if (framework) { params.push(framework); where.push(`framework = $${params.length}`); }
    const sql = `SELECT id, framework, status, auditor, issued_date, expires_date,
                        scope, evidence_link, cost_usd, notes
                 FROM compliance_certifications
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY CASE status WHEN 'active' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'planned' THEN 3 ELSE 4 END,
                          framework`;
    const r = await pool.query(sql, params);
    res.json(r.rows.map(row => ({
      ...row,
      cost_usd: row.cost_usd ? Number(row.cost_usd) : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/gap-vs-deals', async (_req, res) => {
  try {
    // For each framework required by any deal, compute (status, pipeline_value blocked, deals blocked)
    const r = await pool.query(`
      SELECT req.framework,
             cert.status AS startup_status,
             cert.expires_date,
             cert.cost_usd,
             COUNT(DISTINCT req.deal_id) AS deals_requiring,
             COUNT(DISTINCT req.deal_id) FILTER (WHERE req.is_blocker = TRUE) AS deals_blocked,
             SUM(d.value_usd) FILTER (WHERE req.is_blocker = TRUE
                                       AND d.stage NOT IN ('closed_won','closed_lost')) AS blocked_pipeline_usd,
             SUM(d.value_usd) AS total_pipeline_usd
      FROM deal_compliance_requirements req
      JOIN deals d ON d.id = req.deal_id
      LEFT JOIN compliance_certifications cert ON cert.framework = req.framework
      GROUP BY req.framework, cert.status, cert.expires_date, cert.cost_usd
      ORDER BY blocked_pipeline_usd DESC NULLS LAST`);
    res.json(r.rows.map(row => ({
      framework: row.framework,
      startup_status: row.startup_status || 'not_started',
      expires_date: row.expires_date,
      cost_usd: row.cost_usd ? Number(row.cost_usd) : 0,
      deals_requiring: Number(row.deals_requiring),
      deals_blocked: Number(row.deals_blocked),
      blocked_pipeline_usd: row.blocked_pipeline_usd ? Number(row.blocked_pipeline_usd) : 0,
      total_pipeline_usd: row.total_pipeline_usd ? Number(row.total_pipeline_usd) : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/cost-vs-revenue', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT cert.framework, cert.status, cert.cost_usd,
             COALESCE(SUM(d.value_usd) FILTER (WHERE d.stage NOT IN ('closed_won','closed_lost')), 0) AS pipeline_usd,
             COUNT(DISTINCT req.deal_id) AS deals_touched
      FROM compliance_certifications cert
      LEFT JOIN deal_compliance_requirements req ON req.framework = cert.framework
      LEFT JOIN deals d ON d.id = req.deal_id
      GROUP BY cert.framework, cert.status, cert.cost_usd
      ORDER BY pipeline_usd DESC NULLS LAST`);
    res.json(r.rows.map(row => {
      const pipeline = Number(row.pipeline_usd || 0);
      const cost = Number(row.cost_usd || 0);
      return {
        framework: row.framework,
        status: row.status,
        cost_usd: cost,
        pipeline_usd: pipeline,
        deals_touched: Number(row.deals_touched),
        roi_multiple: cost > 0 ? +(pipeline / cost).toFixed(1) : null
      };
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days || '180', 10);
    const r = await pool.query(
      `SELECT id, framework, status, auditor, issued_date, expires_date, evidence_link, cost_usd
       FROM compliance_certifications
       WHERE status='active' AND expires_date IS NOT NULL
         AND expires_date <= CURRENT_DATE + ($1 || ' days')::interval
       ORDER BY expires_date ASC`,
      [days]
    );
    res.json({
      window_days: days,
      certifications: r.rows.map(row => ({
        ...row,
        cost_usd: row.cost_usd ? Number(row.cost_usd) : 0,
        days_until_expiry: row.expires_date
          ? Math.round((new Date(row.expires_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-deal/:dealId', async (req, res) => {
  try {
    const dealId = parseInt(req.params.dealId, 10);
    if (!Number.isFinite(dealId)) return res.status(400).json({ error: 'Invalid dealId' });
    const deal = await pool.query(
      `SELECT d.id, d.title, d.value_usd, d.stage, c.name AS company_name
       FROM deals d JOIN companies c ON c.id = d.company_id WHERE d.id=$1`,
      [dealId]
    );
    if (!deal.rows[0]) return res.status(404).json({ error: 'Deal not found' });
    const reqs = await pool.query(
      `SELECT req.id, req.framework, req.required, req.is_blocker, req.notes,
              cert.status AS startup_status, cert.expires_date, cert.evidence_link
       FROM deal_compliance_requirements req
       LEFT JOIN compliance_certifications cert ON cert.framework = req.framework
       WHERE req.deal_id=$1
       ORDER BY req.is_blocker DESC, req.framework`,
      [dealId]
    );
    const blocked = reqs.rows.filter(r => r.is_blocker && r.startup_status !== 'active').length;
    res.json({ deal: deal.rows[0], requirements: reqs.rows, blocked_count: blocked });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/certifications', async (req, res) => {
  try {
    const { framework, status = 'planned', auditor = null, issued_date = null, expires_date = null,
            scope = null, evidence_link = null, cost_usd = null, notes = null } = req.body || {};
    if (!framework) return res.status(400).json({ error: 'framework required' });
    const r = await pool.query(
      `INSERT INTO compliance_certifications (framework, status, auditor, issued_date, expires_date,
                                              scope, evidence_link, cost_usd, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [framework, status, auditor, issued_date, expires_date, scope, evidence_link, cost_usd, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/deal-requirements', async (req, res) => {
  try {
    const { deal_id, framework, required = true, is_blocker = false, notes = null } = req.body || {};
    if (!deal_id || !framework) return res.status(400).json({ error: 'deal_id and framework required' });
    const r = await pool.query(
      `INSERT INTO deal_compliance_requirements (deal_id, framework, required, is_blocker, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [deal_id, framework, required, is_blocker, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/certifications/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const allowed = ['status', 'auditor', 'issued_date', 'expires_date', 'scope', 'evidence_link', 'cost_usd', 'notes'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    params.push(id);
    const r = await pool.query(
      `UPDATE compliance_certifications SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Certification not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
