// F100 Procurement Playbook — deep feature for per-buyer procurement stage tracking.
//
// Endpoints:
//   GET  /api/deep-procurement-playbook/companies         companies that have a playbook
//   GET  /api/deep-procurement-playbook/by-company/:id    stages for a company
//   GET  /api/deep-procurement-playbook/deal-progress/:dealId  current deal progress vs playbook
//   GET  /api/deep-procurement-playbook/critical-path     longest expected stage durations
//   GET  /api/deep-procurement-playbook/stages-blocked    currently blocked deal stages
//   POST /api/deep-procurement-playbook/stages            add a stage to a company playbook
//   POST /api/deep-procurement-playbook/progress          set deal-stage status

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

router.get('/companies', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id, c.name, c.tier, c.industry, c.revenue_billions,
             COUNT(p.id) AS stage_count,
             SUM(p.typical_duration_days) AS total_typical_days,
             MAX(p.signing_threshold_usd) AS top_signing_threshold_usd
      FROM companies c
      JOIN procurement_playbooks p ON p.company_id = c.id
      GROUP BY c.id, c.name, c.tier, c.industry, c.revenue_billions
      ORDER BY total_typical_days DESC`);
    res.json(r.rows.map(row => ({
      id: row.id, name: row.name, tier: row.tier, industry: row.industry,
      revenue_billions: row.revenue_billions ? Number(row.revenue_billions) : null,
      stage_count: Number(row.stage_count),
      total_typical_days: row.total_typical_days ? Number(row.total_typical_days) : 0,
      top_signing_threshold_usd: row.top_signing_threshold_usd ? Number(row.top_signing_threshold_usd) : null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-company/:id', async (req, res) => {
  try {
    const companyId = parseInt(req.params.id, 10);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Invalid companyId' });
    const meta = await pool.query('SELECT id, name, tier, industry FROM companies WHERE id=$1', [companyId]);
    if (!meta.rows[0]) return res.status(404).json({ error: 'Company not found' });
    const stages = await pool.query(
      `SELECT id, stage_order, stage_name, owner_role, typical_duration_days,
              required_artifacts, signing_threshold_usd, notes
       FROM procurement_playbooks WHERE company_id=$1
       ORDER BY stage_order`,
      [companyId]
    );
    const totalDays = stages.rows.reduce((s, r) => s + (r.typical_duration_days || 0), 0);
    res.json({
      company: meta.rows[0],
      stages: stages.rows,
      total_typical_days: totalDays,
      total_typical_weeks: Math.round(totalDays / 7 * 10) / 10
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/deal-progress/:dealId', async (req, res) => {
  try {
    const dealId = parseInt(req.params.dealId, 10);
    if (!Number.isFinite(dealId)) return res.status(400).json({ error: 'Invalid dealId' });
    const deal = await pool.query(
      `SELECT d.id, d.title, d.value_usd, d.stage, d.probability, d.company_id, c.name AS company_name, c.tier
       FROM deals d JOIN companies c ON c.id = d.company_id WHERE d.id=$1`,
      [dealId]
    );
    if (!deal.rows[0]) return res.status(404).json({ error: 'Deal not found' });

    const playbookStages = await pool.query(
      `SELECT id, stage_order, stage_name, owner_role, typical_duration_days, signing_threshold_usd
       FROM procurement_playbooks WHERE company_id=$1 ORDER BY stage_order`,
      [deal.rows[0].company_id]
    );

    const progress = await pool.query(
      `SELECT id, playbook_id, status, entered_at, completed_at, blocker
       FROM deal_stage_progress WHERE deal_id=$1`,
      [dealId]
    );
    const progressByPb = new Map(progress.rows.map(p => [p.playbook_id, p]));

    const stages = playbookStages.rows.map(s => ({
      ...s,
      progress: progressByPb.get(s.id) || { status: 'not_started', entered_at: null, completed_at: null, blocker: null }
    }));

    const completed = stages.filter(s => s.progress.status === 'completed').length;
    const inProgress = stages.find(s => s.progress.status === 'in_progress');
    const remainingStages = stages.filter(s => s.progress.status !== 'completed');
    const expectedRemainingDays = remainingStages.reduce((s, x) => s + (x.typical_duration_days || 0), 0);

    res.json({
      deal: deal.rows[0],
      stages,
      summary: {
        total_stages: stages.length,
        completed,
        completed_pct: stages.length > 0 ? +(100 * completed / stages.length).toFixed(1) : 0,
        current_stage: inProgress ? inProgress.stage_name : null,
        current_blocker: inProgress ? inProgress.progress.blocker : null,
        expected_remaining_days: expectedRemainingDays,
        expected_remaining_weeks: Math.round(expectedRemainingDays / 7 * 10) / 10
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/critical-path', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.stage_name, p.owner_role,
             COUNT(*) AS occurrences,
             ROUND(AVG(p.typical_duration_days)::numeric, 1) AS avg_days,
             MAX(p.typical_duration_days) AS max_days,
             MIN(p.typical_duration_days) AS min_days
      FROM procurement_playbooks p
      GROUP BY p.stage_name, p.owner_role
      ORDER BY avg_days DESC`);
    res.json(r.rows.map(row => ({
      stage_name: row.stage_name,
      owner_role: row.owner_role,
      occurrences: Number(row.occurrences),
      avg_days: Number(row.avg_days),
      min_days: Number(row.min_days),
      max_days: Number(row.max_days)
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/stages-blocked', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT dsp.id, dsp.deal_id, dsp.status, dsp.entered_at, dsp.blocker,
             d.title AS deal_title, d.value_usd, d.probability,
             c.name AS company_name, c.tier,
             p.stage_name, p.owner_role, p.typical_duration_days
      FROM deal_stage_progress dsp
      JOIN deals d ON d.id = dsp.deal_id
      JOIN companies c ON c.id = d.company_id
      JOIN procurement_playbooks p ON p.id = dsp.playbook_id
      WHERE dsp.status = 'in_progress' AND dsp.blocker IS NOT NULL
      ORDER BY dsp.entered_at ASC`);
    const now = new Date();
    res.json(r.rows.map(row => {
      const daysInStage = row.entered_at
        ? Math.round((now.getTime() - new Date(row.entered_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...row,
        value_usd: row.value_usd ? Number(row.value_usd) : 0,
        days_in_stage: daysInStage,
        is_overdue: daysInStage !== null && row.typical_duration_days
          ? daysInStage > row.typical_duration_days
          : false
      };
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/stages', async (req, res) => {
  try {
    const { company_id, stage_order, stage_name, owner_role, typical_duration_days = null,
            required_artifacts = null, signing_threshold_usd = null, notes = null } = req.body || {};
    if (!company_id || !stage_order || !stage_name) {
      return res.status(400).json({ error: 'company_id, stage_order, stage_name required' });
    }
    const r = await pool.query(
      `INSERT INTO procurement_playbooks (company_id, stage_order, stage_name, owner_role, typical_duration_days,
                                          required_artifacts, signing_threshold_usd, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [company_id, stage_order, stage_name, owner_role, typical_duration_days,
       required_artifacts, signing_threshold_usd, notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/progress', async (req, res) => {
  try {
    const { deal_id, playbook_id, status, blocker = null } = req.body || {};
    if (!deal_id || !playbook_id || !status) {
      return res.status(400).json({ error: 'deal_id, playbook_id, status required' });
    }
    const entered_at = status === 'in_progress' ? new Date() : null;
    const completed_at = status === 'completed' ? new Date() : null;
    const existing = await pool.query(
      'SELECT id FROM deal_stage_progress WHERE deal_id=$1 AND playbook_id=$2',
      [deal_id, playbook_id]
    );
    let row;
    if (existing.rows[0]) {
      const r = await pool.query(
        `UPDATE deal_stage_progress SET status=$1, blocker=$2,
            entered_at=COALESCE($3, entered_at), completed_at=COALESCE($4, completed_at)
         WHERE id=$5 RETURNING *`,
        [status, blocker, entered_at, completed_at, existing.rows[0].id]
      );
      row = r.rows[0];
    } else {
      const r = await pool.query(
        `INSERT INTO deal_stage_progress (deal_id, playbook_id, status, entered_at, completed_at, blocker)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [deal_id, playbook_id, status, entered_at, completed_at, blocker]
      );
      row = r.rows[0];
    }
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
