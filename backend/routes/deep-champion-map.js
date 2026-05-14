// Champion Map / Org Chart — deep feature for multi-threading coverage tracking.
//
// Endpoints:
//   GET  /api/deep-champion-map/by-company/:companyId   org tree + role tags
//   GET  /api/deep-champion-map/multi-thread-score/:companyId  coverage score 0..100
//   GET  /api/deep-champion-map/buyer-roles            distinct roles + counts
//   GET  /api/deep-champion-map/coverage-summary       per-deal champion-map coverage
//   POST /api/deep-champion-map/relationships          add reporting relationship + role tag
//   PATCH /api/deep-champion-map/relationships/:id    update role / signing authority

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// CISO / VP-Sec / VP-Eng / Procurement / Legal / Finance — the canonical F100 buyer roles we
// expect to multi-thread. Coverage score = how many distinct buyer_role slots have at least
// one contact mapped, weighted by relationship_strength on the contact.
const CANONICAL_ROLES = ['economic_buyer', 'champion', 'technical_buyer',
                         'security_buyer', 'procurement_buyer', 'legal_buyer',
                         'finance_buyer', 'user_buyer'];

router.get('/by-company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Invalid companyId' });
    const r = await pool.query(
      `SELECT c.id, c.name, c.title, c.email, c.decision_maker, c.relationship_strength, c.last_contacted,
              orel.id AS rel_id, orel.reports_to_id, orel.function_area, orel.is_line,
              orel.signing_authority_usd, orel.buyer_role,
              parent.name AS reports_to_name, parent.title AS reports_to_title
       FROM contacts c
       LEFT JOIN org_relationships orel ON orel.contact_id = c.id
       LEFT JOIN contacts parent ON parent.id = orel.reports_to_id
       WHERE c.company_id=$1
       ORDER BY orel.signing_authority_usd DESC NULLS LAST, c.name`,
      [companyId]
    );
    res.json({ company_id: companyId, contacts: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/multi-thread-score/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Invalid companyId' });

    // Contacts with role-tag at the company
    const r = await pool.query(
      `SELECT c.id, c.name, c.title, c.relationship_strength, c.decision_maker,
              orel.buyer_role, orel.function_area, orel.signing_authority_usd
       FROM contacts c
       LEFT JOIN org_relationships orel ON orel.contact_id = c.id
       WHERE c.company_id=$1`,
      [companyId]
    );

    const strengthWeights = { champion: 1.0, sponsor: 0.9, engaged: 0.7, warm: 0.5, cold: 0.2 };
    const rolesCovered = new Map(); // role -> best strength

    for (const row of r.rows) {
      if (!row.buyer_role) continue;
      const w = strengthWeights[row.relationship_strength] || 0.2;
      const prev = rolesCovered.get(row.buyer_role) || 0;
      if (w > prev) rolesCovered.set(row.buyer_role, w);
    }

    const coveredCount = rolesCovered.size;
    const weightedScore = Array.from(rolesCovered.values()).reduce((a, b) => a + b, 0);
    const maxScore = CANONICAL_ROLES.length;
    const coverage_pct = +(100 * coveredCount / maxScore).toFixed(1);
    const strength_pct = +(100 * weightedScore / maxScore).toFixed(1);

    const missing = CANONICAL_ROLES.filter(r => !rolesCovered.has(r));

    res.json({
      company_id: companyId,
      total_contacts: r.rows.length,
      contacts_with_role: r.rows.filter(x => x.buyer_role).length,
      covered_roles: Array.from(rolesCovered.entries()).map(([role, w]) => ({ role, weight: w })),
      missing_roles: missing,
      coverage_pct,
      strength_pct,
      verdict: strength_pct >= 70 ? 'strong_multi_thread'
             : strength_pct >= 40 ? 'partial_multi_thread'
             : 'single_threaded_risk'
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/buyer-roles', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT orel.buyer_role,
             COUNT(*) AS contact_count,
             COUNT(DISTINCT c.company_id) AS companies_touched,
             ROUND(AVG(orel.signing_authority_usd)::numeric, 0) AS avg_signing_authority_usd
      FROM org_relationships orel
      JOIN contacts c ON c.id = orel.contact_id
      WHERE orel.buyer_role IS NOT NULL
      GROUP BY orel.buyer_role
      ORDER BY contact_count DESC`);
    res.json(r.rows.map(row => ({
      buyer_role: row.buyer_role,
      contact_count: Number(row.contact_count),
      companies_touched: Number(row.companies_touched),
      avg_signing_authority_usd: row.avg_signing_authority_usd ? Number(row.avg_signing_authority_usd) : null
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/coverage-summary', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.id AS deal_id, d.title, d.value_usd, d.stage, d.probability,
             c.id AS company_id, c.name AS company_name, c.tier,
             COUNT(DISTINCT contact.id) AS contacts,
             COUNT(DISTINCT contact.id) FILTER (WHERE contact.decision_maker = TRUE) AS decision_makers,
             COUNT(DISTINCT orel.buyer_role) AS distinct_roles_covered
      FROM deals d
      JOIN companies c ON c.id = d.company_id
      LEFT JOIN contacts contact ON contact.company_id = c.id
      LEFT JOIN org_relationships orel ON orel.contact_id = contact.id
      WHERE d.stage NOT IN ('closed_won','closed_lost')
      GROUP BY d.id, d.title, d.value_usd, d.stage, d.probability, c.id, c.name, c.tier
      ORDER BY d.value_usd DESC NULLS LAST`);
    res.json(r.rows.map(row => ({
      deal_id: row.deal_id,
      title: row.title,
      value_usd: row.value_usd ? Number(row.value_usd) : 0,
      stage: row.stage,
      probability: row.probability,
      company_id: row.company_id,
      company_name: row.company_name,
      tier: row.tier,
      contacts: Number(row.contacts),
      decision_makers: Number(row.decision_makers),
      distinct_roles_covered: Number(row.distinct_roles_covered),
      single_thread_risk: Number(row.distinct_roles_covered) <= 1
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/relationships', async (req, res) => {
  try {
    const { contact_id, reports_to_id = null, function_area = null, is_line = true,
            signing_authority_usd = null, buyer_role = null } = req.body || {};
    if (!contact_id) return res.status(400).json({ error: 'contact_id required' });
    if (reports_to_id && reports_to_id === contact_id) {
      return res.status(400).json({ error: 'contact cannot report to itself' });
    }
    const r = await pool.query(
      `INSERT INTO org_relationships (contact_id, reports_to_id, function_area, is_line, signing_authority_usd, buyer_role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [contact_id, reports_to_id, function_area, is_line, signing_authority_usd, buyer_role]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/relationships/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const allowed = ['reports_to_id', 'function_area', 'is_line', 'signing_authority_usd', 'buyer_role'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    params.push(id);
    const r = await pool.query(
      `UPDATE org_relationships SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Relationship not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
