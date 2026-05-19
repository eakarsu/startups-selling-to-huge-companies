// Security Questionnaire Bank — deep feature for SIG / CAIQ / VSAQ answer reuse.
//
// Endpoints:
//   GET  /api/deep-security-questionnaires/questions             list questions (filter framework / domain)
//   GET  /api/deep-security-questionnaires/frameworks            framework coverage summary
//   GET  /api/deep-security-questionnaires/domain-coverage       per-domain answered vs unanswered
//   GET  /api/deep-security-questionnaires/responses             list responses (filter status / company)
//   GET  /api/deep-security-questionnaires/by-company/:companyId company-specific response set
//   GET  /api/deep-security-questionnaires/coverage              answer-bank reuse rate per framework
//   POST /api/deep-security-questionnaires/responses             save a response
//   PATCH /api/deep-security-questionnaires/responses/:id       update response/status/confidence

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

router.get('/questions', async (req, res) => {
  try {
    const { framework, domain, q } = req.query;
    const params = [];
    const where = [];
    if (framework) { params.push(framework); where.push(`framework = $${params.length}`); }
    if (domain)    { params.push(domain);    where.push(`domain = $${params.length}`); }
    if (q)         { params.push(`%${q}%`);  where.push(`(question_text ILIKE $${params.length} OR question_code ILIKE $${params.length})`); }
    const sql = `SELECT id, framework, question_code, domain, question_text, expected_artifact
                 FROM security_questions
                 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
                 ORDER BY framework, domain, question_code`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/frameworks', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT q.framework,
             COUNT(DISTINCT q.id) AS total_questions,
             COUNT(DISTINCT q.domain) AS domains,
             COUNT(DISTINCT r.id) AS total_responses,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'approved') AS approved,
             ROUND(AVG(r.confidence)::numeric, 1) AS avg_confidence
      FROM security_questions q
      LEFT JOIN security_responses r ON r.question_id = q.id
      GROUP BY q.framework
      ORDER BY q.framework`);
    res.json(r.rows.map(row => ({
      framework: row.framework,
      total_questions: Number(row.total_questions),
      domains: Number(row.domains),
      total_responses: Number(row.total_responses),
      approved: Number(row.approved),
      avg_confidence: row.avg_confidence ? Number(row.avg_confidence) : null,
      answer_bank_pct: row.total_questions > 0
        ? +(100 * Number(row.approved) / Number(row.total_questions)).toFixed(1)
        : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/domain-coverage', async (req, res) => {
  try {
    const { framework } = req.query;
    const params = [];
    const where = [];
    if (framework) { params.push(framework); where.push(`q.framework = $${params.length}`); }
    const sql = `
      SELECT q.framework, q.domain,
             COUNT(DISTINCT q.id) AS questions,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status='approved') AS answered_approved,
             COUNT(DISTINCT r.id) FILTER (WHERE r.status='draft' OR r.status='in_review') AS in_progress
      FROM security_questions q
      LEFT JOIN security_responses r ON r.question_id = q.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY q.framework, q.domain
      ORDER BY q.framework, q.domain`;
    const r = await pool.query(sql, params);
    res.json(r.rows.map(row => ({
      framework: row.framework,
      domain: row.domain,
      questions: Number(row.questions),
      answered_approved: Number(row.answered_approved),
      in_progress: Number(row.in_progress),
      coverage_pct: row.questions > 0
        ? +(100 * Number(row.answered_approved) / Number(row.questions)).toFixed(1)
        : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/responses', async (req, res) => {
  try {
    const { status, company_id, framework } = req.query;
    const params = [];
    const where = [];
    if (status)     { params.push(status);     where.push(`r.status = $${params.length}`); }
    if (company_id) { params.push(company_id); where.push(`r.company_id = $${params.length}`); }
    if (framework)  { params.push(framework);  where.push(`q.framework = $${params.length}`); }
    const sql = `
      SELECT r.*, q.framework, q.question_code, q.domain, q.question_text,
             c.name AS company_name
      FROM security_responses r
      JOIN security_questions q ON q.id = r.question_id
      LEFT JOIN companies c ON c.id = r.company_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY r.updated_at DESC`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-company/:companyId', async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    if (!Number.isFinite(companyId)) return res.status(400).json({ error: 'Invalid companyId' });
    const r = await pool.query(
      `SELECT r.*, q.framework, q.question_code, q.domain, q.question_text, q.expected_artifact
       FROM security_responses r JOIN security_questions q ON q.id = r.question_id
       WHERE r.company_id=$1
       ORDER BY q.framework, q.domain, q.question_code`,
      [companyId]
    );
    const grouped = {};
    for (const row of r.rows) {
      grouped[row.framework] = grouped[row.framework] || [];
      grouped[row.framework].push(row);
    }
    res.json({ company_id: companyId, total: r.rows.length, by_framework: grouped });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/coverage', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT q.framework,
             COUNT(DISTINCT q.id) AS total_questions,
             COUNT(DISTINCT q.id) FILTER (
               WHERE EXISTS (
                 SELECT 1 FROM security_responses sr
                 WHERE sr.question_id = q.id AND sr.status IN ('approved','in_review')
               )
             ) AS reusable_answers
      FROM security_questions q
      GROUP BY q.framework
      ORDER BY q.framework`);
    res.json({
      frameworks: r.rows.map(row => ({
        framework: row.framework,
        total_questions: Number(row.total_questions),
        reusable_answers: Number(row.reusable_answers),
        reuse_rate_pct: row.total_questions > 0
          ? +(100 * Number(row.reusable_answers) / Number(row.total_questions)).toFixed(1)
          : 0
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/responses', async (req, res) => {
  try {
    const { question_id, company_id, response, evidence_link = null,
            status = 'draft', confidence = null, reviewer = null } = req.body || {};
    if (!question_id || !response) {
      return res.status(400).json({ error: 'question_id and response required' });
    }
    const r = await pool.query(
      `INSERT INTO security_responses (question_id, company_id, response, evidence_link, status, confidence, reviewer, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
      [question_id, company_id, response, evidence_link, status, confidence, reviewer]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/responses/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const allowed = ['response', 'evidence_link', 'status', 'confidence', 'reviewer'];
    const sets = []; const params = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { params.push(req.body[k]); sets.push(`${k}=$${params.length}`); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No updatable fields supplied' });
    sets.push(`updated_at=NOW()`);
    params.push(id);
    const r = await pool.query(
      `UPDATE security_responses SET ${sets.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'Response not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
