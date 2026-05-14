// Pilot Success Scorecards — deep feature for F100 pilot → MSA conversion tracking.
//
// Endpoints:
//   GET  /api/deep-pilot-scorecards/pilots               list pilots with summary
//   GET  /api/deep-pilot-scorecards/pilots/:id           pilot detail + metrics + score
//   GET  /api/deep-pilot-scorecards/conversion-funnel    pilots-to-MSA conversion economics
//   GET  /api/deep-pilot-scorecards/at-risk              pilots failing >25% of metrics
//   POST /api/deep-pilot-scorecards/pilots               create pilot
//   POST /api/deep-pilot-scorecards/metrics              add metric to a pilot
//   PATCH /api/deep-pilot-scorecards/metrics/:id        update current_value

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function scorePilot(metrics) {
  // Per-metric pass = (current/target * 100) >= threshold_pct (default 100)
  let passing = 0;
  let totalWeight = 0;
  const detail = metrics.map(m => {
    const target = Number(m.target_value);
    const current = Number(m.current_value);
    const threshold = Number(m.threshold_pct || 100);
    const pct = target > 0 ? +(100 * current / target).toFixed(1) : 0;
    const pass = pct >= threshold;
    if (pass) passing += 1;
    totalWeight += 1;
    return { ...m, achievement_pct: pct, pass };
  });
  const score = totalWeight > 0 ? +(100 * passing / totalWeight).toFixed(1) : 0;
  return { metrics: detail, metrics_passing: passing, metrics_total: totalWeight, score };
}

router.get('/pilots', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.id, p.pilot_name, p.deal_id, p.company_id, p.start_date, p.end_date,
             p.budget_usd, p.exec_sponsor, p.status, p.conversion_target_arr_usd, p.success_criteria,
             d.title AS deal_title, d.value_usd AS deal_value, d.stage AS deal_stage,
             c.name AS company_name, c.tier AS company_tier,
             COUNT(pm.id) AS metric_count
      FROM pilots p
      LEFT JOIN deals d ON d.id = p.deal_id
      LEFT JOIN companies c ON c.id = p.company_id
      LEFT JOIN pilot_metrics pm ON pm.pilot_id = p.id
      GROUP BY p.id, d.title, d.value_usd, d.stage, c.name, c.tier
      ORDER BY p.end_date DESC NULLS LAST`);
    res.json(r.rows.map(row => ({
      ...row,
      budget_usd: row.budget_usd ? Number(row.budget_usd) : 0,
      deal_value: row.deal_value ? Number(row.deal_value) : 0,
      conversion_target_arr_usd: row.conversion_target_arr_usd ? Number(row.conversion_target_arr_usd) : 0,
      metric_count: Number(row.metric_count)
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/pilots/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const pilot = await pool.query(
      `SELECT p.*, d.title AS deal_title, d.stage AS deal_stage, d.value_usd AS deal_value,
              c.name AS company_name, c.tier AS company_tier
       FROM pilots p LEFT JOIN deals d ON d.id = p.deal_id LEFT JOIN companies c ON c.id = p.company_id
       WHERE p.id=$1`,
      [id]
    );
    if (!pilot.rows[0]) return res.status(404).json({ error: 'Pilot not found' });
    const metrics = await pool.query(
      `SELECT id, metric_name, target_value, current_value, unit, threshold_pct, recorded_at
       FROM pilot_metrics WHERE pilot_id=$1 ORDER BY id`,
      [id]
    );
    const scored = scorePilot(metrics.rows);
    res.json({ pilot: pilot.rows[0], ...scored });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/conversion-funnel', async (_req, res) => {
  try {
    const pilots = await pool.query(`
      SELECT p.id, p.status, p.budget_usd, p.conversion_target_arr_usd,
             d.stage AS deal_stage, d.value_usd AS deal_value
      FROM pilots p LEFT JOIN deals d ON d.id = p.deal_id`);
    const metrics = await pool.query('SELECT pilot_id, target_value, current_value, threshold_pct FROM pilot_metrics');
    const byPilot = new Map();
    for (const m of metrics.rows) {
      const a = byPilot.get(m.pilot_id) || []; a.push(m); byPilot.set(m.pilot_id, a);
    }

    const total = pilots.rows.length;
    let active = 0, completed = 0, passing = 0;
    let totalBudget = 0, totalTargetArr = 0, convertedValue = 0;

    for (const p of pilots.rows) {
      totalBudget += Number(p.budget_usd || 0);
      totalTargetArr += Number(p.conversion_target_arr_usd || 0);
      if (p.status === 'active') active += 1;
      if (p.status === 'completed') completed += 1;
      const m = byPilot.get(p.id) || [];
      const { score } = scorePilot(m);
      if (score >= 75) passing += 1;
      if (p.deal_stage === 'closed_won') convertedValue += Number(p.deal_value || 0);
    }

    res.json({
      total_pilots: total,
      active,
      completed,
      passing_75pct: passing,
      total_budget_usd: totalBudget,
      total_target_arr_usd: totalTargetArr,
      converted_value_usd: convertedValue,
      avg_budget_per_pilot_usd: total > 0 ? Math.round(totalBudget / total) : 0,
      arr_to_budget_multiple: totalBudget > 0 ? +(totalTargetArr / totalBudget).toFixed(1) : 0,
      conversion_pass_rate_pct: total > 0 ? +(100 * passing / total).toFixed(1) : 0
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/at-risk', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.id, p.pilot_name, p.status, p.end_date, p.exec_sponsor,
             c.name AS company_name, c.tier AS company_tier,
             d.title AS deal_title, d.value_usd AS deal_value
      FROM pilots p
      LEFT JOIN companies c ON c.id = p.company_id
      LEFT JOIN deals d ON d.id = p.deal_id
      WHERE p.status='active'`);
    const metrics = await pool.query('SELECT pilot_id, target_value, current_value, threshold_pct, metric_name FROM pilot_metrics');
    const byPilot = new Map();
    for (const m of metrics.rows) {
      const arr = byPilot.get(m.pilot_id) || []; arr.push(m); byPilot.set(m.pilot_id, arr);
    }
    const at_risk = r.rows.map(row => {
      const m = byPilot.get(row.id) || [];
      const { score, metrics_passing, metrics_total, metrics: detail } = scorePilot(m);
      return { ...row, score, metrics_passing, metrics_total, failing: detail.filter(x => !x.pass) };
    }).filter(p => p.score < 75);
    res.json(at_risk.sort((a, b) => a.score - b.score));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pilots', async (req, res) => {
  try {
    const { deal_id, company_id, pilot_name, start_date, end_date, budget_usd,
            exec_sponsor, status = 'active', conversion_target_arr_usd = null,
            success_criteria = null } = req.body || {};
    if (!company_id || !pilot_name) return res.status(400).json({ error: 'company_id and pilot_name required' });
    const r = await pool.query(
      `INSERT INTO pilots (deal_id, company_id, pilot_name, start_date, end_date, budget_usd, exec_sponsor,
                           status, conversion_target_arr_usd, success_criteria)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [deal_id, company_id, pilot_name, start_date, end_date, budget_usd, exec_sponsor,
       status, conversion_target_arr_usd, success_criteria]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/metrics', async (req, res) => {
  try {
    const { pilot_id, metric_name, target_value, current_value = 0, unit = null, threshold_pct = 100 } = req.body || {};
    if (!pilot_id || !metric_name || target_value === undefined) {
      return res.status(400).json({ error: 'pilot_id, metric_name, target_value required' });
    }
    const r = await pool.query(
      `INSERT INTO pilot_metrics (pilot_id, metric_name, target_value, current_value, unit, threshold_pct)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [pilot_id, metric_name, target_value, current_value, unit, threshold_pct]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/metrics/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const allowed = ['target_value', 'current_value', 'unit', 'threshold_pct', 'metric_name'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    sets.push(`recorded_at=NOW()`);
    params.push(id);
    const r = await pool.query(
      `UPDATE pilot_metrics SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Metric not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
