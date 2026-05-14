const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

// GET /api/dashboard/stats — KPIs + recent audit activity
router.get('/stats', auth, async (req, res) => {
  try {
    // Companies in pipeline = companies with at least one open deal
    const companiesInPipelineQ = db.query(
      `SELECT COUNT(DISTINCT d.company_id)::int AS n
         FROM deals d
        WHERE d.stage NOT IN ('closed_won','closed_lost')`
    );

    // Active deals = open deals
    const activeDealsQ = db.query(
      `SELECT COUNT(*)::int AS n
         FROM deals
        WHERE stage NOT IN ('closed_won','closed_lost')`
    );

    // Total contacts
    const contactsQ = db.query(`SELECT COUNT(*)::int AS n FROM contacts`);

    // Deals closing this quarter (open deals with expected_close in current quarter)
    const closingThisQuarterQ = db.query(
      `SELECT COUNT(*)::int AS n
         FROM deals
        WHERE stage NOT IN ('closed_won','closed_lost')
          AND expected_close IS NOT NULL
          AND date_trunc('quarter', expected_close) = date_trunc('quarter', CURRENT_DATE)`
    );

    // Win rate: closed_won / (closed_won + closed_lost)
    const winLossQ = db.query(
      `SELECT
         SUM(CASE WHEN stage='closed_won'  THEN 1 ELSE 0 END)::int AS won,
         SUM(CASE WHEN stage='closed_lost' THEN 1 ELSE 0 END)::int AS lost
       FROM deals`
    );

    // Pipeline value of open deals (bonus context for cards)
    const pipelineValueQ = db.query(
      `SELECT COALESCE(SUM(value_usd),0)::float AS v
         FROM deals
        WHERE stage NOT IN ('closed_won','closed_lost')`
    );

    // Recent audit log activity
    const recentActivityQ = db.query(
      `SELECT id, user_email, action, entity, entity_id, details, created_at
         FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 15`
    );

    const [cip, ad, ct, ctq, wl, pv, ra] = await Promise.all([
      companiesInPipelineQ, activeDealsQ, contactsQ, closingThisQuarterQ, winLossQ, pipelineValueQ, recentActivityQ
    ]);

    const won = wl.rows[0]?.won || 0;
    const lost = wl.rows[0]?.lost || 0;
    const total = won + lost;
    const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

    res.json({
      kpis: {
        companies_in_pipeline: cip.rows[0]?.n || 0,
        active_deals: ad.rows[0]?.n || 0,
        total_contacts: ct.rows[0]?.n || 0,
        deals_closing_this_quarter: ctq.rows[0]?.n || 0,
        win_rate_pct: winRate,
        won_count: won,
        lost_count: lost,
        pipeline_value_usd: pv.rows[0]?.v || 0
      },
      recent_activity: ra.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
