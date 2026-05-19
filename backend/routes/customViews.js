// Custom Views — 4 endpoints supporting enterprise sales advisory views.
//
// Endpoints (all GET unless noted):
//   GET  /api/custom-views/deal-stage-chart      VIZ: deal counts/value per stage
//   GET  /api/custom-views/account-heatmap        VIZ: account x signal heatmap
//   GET  /api/custom-views/pitch-deck-pdf         NON-VIZ: enterprise pitch deck PDF
//   GET  /api/custom-views/playbook-rules         NON-VIZ: list playbook rules
//   POST /api/custom-views/playbook-rules         NON-VIZ: create rule
//   PUT  /api/custom-views/playbook-rules/:id     NON-VIZ: update rule
//   DELETE /api/custom-views/playbook-rules/:id   NON-VIZ: delete rule

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// In-memory playbook rules store (CRUD). Seeded with enterprise-sales advisory rules.
let _rulesNextId = 7;
const playbookRules = [
  { id: 1, name: 'Multi-thread by week 3', category: 'engagement', condition: 'days_since_first_meeting > 21', action: 'Identify and engage 3+ additional buyer roles', priority: 'high', enabled: true },
  { id: 2, name: 'Security questionnaire SLA', category: 'security', condition: 'questionnaire_received_at + 5d', action: 'Submit completed SIG/CAIQ within 5 business days', priority: 'high', enabled: true },
  { id: 3, name: 'Champion call cadence', category: 'engagement', condition: 'no_champion_touch > 14d', action: 'Schedule 1:1 with champion, deliver new insight', priority: 'medium', enabled: true },
  { id: 4, name: 'Procurement engagement trigger', category: 'procurement', condition: 'deal_value_usd > 250000', action: 'Loop in procurement counterpart before legal review', priority: 'high', enabled: true },
  { id: 5, name: 'Pilot success criteria signed', category: 'pilot', condition: 'pilot_kickoff_scheduled', action: 'Require written success criteria signed by economic buyer', priority: 'high', enabled: true },
  { id: 6, name: 'Quarterly business review', category: 'expansion', condition: 'account_tenure > 90d', action: 'Schedule QBR with executive sponsor each quarter', priority: 'medium', enabled: true }
];

// ----- VIZ 1: deal stage chart -----
router.get('/deal-stage-chart', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT stage,
             COUNT(*)::int AS deal_count,
             COALESCE(SUM(value_usd), 0)::numeric AS total_value,
             COALESCE(AVG(probability), 0)::numeric AS avg_probability,
             COALESCE(SUM(value_usd * probability / 100.0), 0)::numeric AS weighted_value
      FROM deals
      GROUP BY stage
      ORDER BY total_value DESC`);
    const stages = r.rows.map(row => ({
      stage: row.stage || 'unknown',
      deal_count: Number(row.deal_count),
      total_value: Number(row.total_value),
      avg_probability: +Number(row.avg_probability).toFixed(1),
      weighted_value: Number(row.weighted_value)
    }));
    const totalDeals = stages.reduce((s, x) => s + x.deal_count, 0);
    const totalValue = stages.reduce((s, x) => s + x.total_value, 0);
    const totalWeighted = stages.reduce((s, x) => s + x.weighted_value, 0);
    const maxValue = stages.reduce((m, x) => Math.max(m, x.total_value), 0);
    res.json({
      stages: stages.map(s => ({
        ...s,
        pct_of_pipeline: totalValue > 0 ? +(100 * s.total_value / totalValue).toFixed(1) : 0,
        bar_pct: maxValue > 0 ? +(100 * s.total_value / maxValue).toFixed(1) : 0
      })),
      summary: {
        total_deals: totalDeals,
        total_pipeline_value: totalValue,
        total_weighted_value: totalWeighted,
        stage_count: stages.length
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----- VIZ 2: account x signal heatmap -----
router.get('/account-heatmap', async (_req, res) => {
  try {
    const companiesRes = await pool.query(`
      SELECT c.id, c.name, c.tier, c.industry,
             COALESCE(SUM(d.value_usd), 0)::numeric AS pipeline_value
      FROM companies c
      LEFT JOIN deals d ON d.company_id = c.id
      GROUP BY c.id, c.name, c.tier, c.industry
      ORDER BY pipeline_value DESC
      LIMIT 12`);

    const ids = companiesRes.rows.map(r => r.id);
    if (ids.length === 0) {
      return res.json({ accounts: [], signals: [], matrix: [], legend: {} });
    }

    const dealsRes = await pool.query(
      `SELECT company_id, COUNT(*)::int AS open_deals, MAX(last_activity_at) AS last_activity
       FROM deals WHERE company_id = ANY($1) GROUP BY company_id`, [ids]);
    const actRes = await pool.query(
      `SELECT d.company_id, COUNT(a.id)::int AS activity_count
       FROM deals d LEFT JOIN activities a ON a.deal_id = d.id
       WHERE d.company_id = ANY($1) GROUP BY d.company_id`, [ids]);
    const notesRes = await pool.query(
      `SELECT d.company_id, COUNT(n.id)::int AS note_count
       FROM deals d LEFT JOIN notes n ON n.deal_id = d.id
       WHERE d.company_id = ANY($1) GROUP BY d.company_id`, [ids]);
    const contactsRes = await pool.query(
      `SELECT company_id, COUNT(*)::int AS contact_count
       FROM contacts WHERE company_id = ANY($1) GROUP BY company_id`, [ids]);

    const dealsMap = new Map(dealsRes.rows.map(r => [r.company_id, r]));
    const actMap = new Map(actRes.rows.map(r => [r.company_id, Number(r.activity_count)]));
    const notesMap = new Map(notesRes.rows.map(r => [r.company_id, Number(r.note_count)]));
    const contactsMap = new Map(contactsRes.rows.map(r => [r.company_id, Number(r.contact_count)]));

    const now = Date.now();
    const signals = ['Pipeline $', 'Open Deals', 'Activities', 'Notes', 'Contacts', 'Recency'];

    function intensity(value, max) {
      if (!max || max <= 0) return 0;
      const v = Math.max(0, Math.min(1, value / max));
      return +(v * 100).toFixed(0);
    }

    const rawMatrix = companiesRes.rows.map(c => {
      const dealInfo = dealsMap.get(c.id) || {};
      const openDeals = Number(dealInfo.open_deals || 0);
      const activityCount = actMap.get(c.id) || 0;
      const noteCount = notesMap.get(c.id) || 0;
      const contactCount = contactsMap.get(c.id) || 0;
      const lastAct = dealInfo.last_activity ? new Date(dealInfo.last_activity).getTime() : null;
      const daysSince = lastAct ? Math.round((now - lastAct) / 86400000) : 365;
      const recencyScore = Math.max(0, 60 - daysSince); // higher = more recent
      return {
        account_id: c.id,
        account_name: c.name,
        tier: c.tier,
        industry: c.industry,
        raw: {
          pipeline: Number(c.pipeline_value),
          open_deals: openDeals,
          activities: activityCount,
          notes: noteCount,
          contacts: contactCount,
          recency_score: recencyScore,
          days_since_activity: daysSince
        }
      };
    });

    const maxPipe = Math.max(1, ...rawMatrix.map(r => r.raw.pipeline));
    const maxDeals = Math.max(1, ...rawMatrix.map(r => r.raw.open_deals));
    const maxAct = Math.max(1, ...rawMatrix.map(r => r.raw.activities));
    const maxNotes = Math.max(1, ...rawMatrix.map(r => r.raw.notes));
    const maxContacts = Math.max(1, ...rawMatrix.map(r => r.raw.contacts));
    const maxRecency = Math.max(1, ...rawMatrix.map(r => r.raw.recency_score));

    const matrix = rawMatrix.map(r => ({
      account_id: r.account_id,
      account_name: r.account_name,
      tier: r.tier,
      industry: r.industry,
      cells: [
        { signal: 'Pipeline $', value: r.raw.pipeline, score: intensity(r.raw.pipeline, maxPipe) },
        { signal: 'Open Deals', value: r.raw.open_deals, score: intensity(r.raw.open_deals, maxDeals) },
        { signal: 'Activities', value: r.raw.activities, score: intensity(r.raw.activities, maxAct) },
        { signal: 'Notes', value: r.raw.notes, score: intensity(r.raw.notes, maxNotes) },
        { signal: 'Contacts', value: r.raw.contacts, score: intensity(r.raw.contacts, maxContacts) },
        { signal: 'Recency', value: r.raw.days_since_activity, score: intensity(r.raw.recency_score, maxRecency) }
      ]
    }));

    res.json({
      accounts: rawMatrix.map(r => ({ id: r.account_id, name: r.account_name, tier: r.tier })),
      signals,
      matrix,
      legend: { score_scale: '0=cold ... 100=hottest', generated_at: new Date().toISOString() }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----- NON-VIZ 1: enterprise pitch deck PDF -----
// Returns a minimal valid single-page PDF describing an enterprise pitch deck summary
// pulled from live DB. Content-Type application/pdf so it downloads/opens natively.
router.get('/pitch-deck-pdf', async (_req, res) => {
  try {
    const companies = await pool.query(
      `SELECT name, tier, industry, COALESCE(revenue_billions, 0)::numeric AS rev
       FROM companies ORDER BY revenue_billions DESC NULLS LAST LIMIT 6`);
    const dealAgg = await pool.query(
      `SELECT COUNT(*)::int AS deal_count, COALESCE(SUM(value_usd),0)::numeric AS pipe FROM deals`);
    const winLoss = await pool.query(
      `SELECT stage, COUNT(*)::int AS n FROM deals GROUP BY stage`);
    const totalPipe = Number(dealAgg.rows[0].pipe || 0);
    const dealCount = Number(dealAgg.rows[0].deal_count || 0);
    const stageLines = winLoss.rows.map(r => `${r.stage}: ${r.n}`).join(', ');
    const topAccounts = companies.rows.map(r =>
      `${r.name} (${r.tier || '-'}, ${r.industry || '-'}, $${Number(r.rev).toFixed(1)}B)`
    );

    // Build PDF lines (kept short to satisfy single-page layout).
    const lines = [
      'EnterpriseOS - Enterprise Pitch Deck',
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'Slide 1: Why Enterprise, Why Now',
      '  AI lets small teams ship F100-grade depth in months, not years.',
      '  F100 buyers are awake, looking for AI-native vendors.',
      '',
      'Slide 2: Pipeline Snapshot',
      `  Open deals: ${dealCount}`,
      `  Pipeline value: $${(totalPipe / 1e6).toFixed(2)}M`,
      `  Stage mix: ${stageLines}`,
      '',
      'Slide 3: Top Enterprise Accounts',
      ...topAccounts.map(t => `  - ${t}`),
      '',
      'Slide 4: Land-and-Expand Motion',
      '  Pilot ($150-600K) -> MSA -> Platform expansion.',
      '  Security (SOC2/ISO27001) and procurement playbook ready.',
      '',
      'Slide 5: The Ask',
      '  Multi-thread 3+ buyer roles per account.',
      '  Apply playbook rules on every deal > $250K.'
    ];

    // Escape lines for PDF literal strings (parens + backslashes).
    const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    let content = 'BT /F1 11 Tf 50 780 Td 14 TL\n';
    lines.forEach((ln, i) => {
      if (i === 0) content += `(${esc(ln)}) Tj\n`;
      else content += `T* (${esc(ln)}) Tj\n`;
    });
    content += 'ET';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream\nendobj\n`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach(o => {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += o;
    });
    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    const buf = Buffer.from(pdf, 'utf8');
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', 'inline; filename="enterprise-pitch-deck.pdf"');
    res.set('Content-Length', String(buf.length));
    res.send(buf);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ----- NON-VIZ 2: playbook rules CRUD -----
router.get('/playbook-rules', (_req, res) => {
  res.json({
    rules: playbookRules,
    summary: {
      total: playbookRules.length,
      enabled: playbookRules.filter(r => r.enabled).length,
      by_priority: playbookRules.reduce((m, r) => { m[r.priority] = (m[r.priority] || 0) + 1; return m; }, {}),
      by_category: playbookRules.reduce((m, r) => { m[r.category] = (m[r.category] || 0) + 1; return m; }, {})
    }
  });
});

router.post('/playbook-rules', (req, res) => {
  const { name, category, condition, action, priority = 'medium', enabled = true } = req.body || {};
  if (!name || !category || !condition || !action) {
    return res.status(400).json({ error: 'name, category, condition, action required' });
  }
  const rule = { id: _rulesNextId++, name, category, condition, action, priority, enabled: !!enabled };
  playbookRules.push(rule);
  res.status(201).json(rule);
});

router.put('/playbook-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rule = playbookRules.find(r => r.id === id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });
  const { name, category, condition, action, priority, enabled } = req.body || {};
  if (name !== undefined) rule.name = name;
  if (category !== undefined) rule.category = category;
  if (condition !== undefined) rule.condition = condition;
  if (action !== undefined) rule.action = action;
  if (priority !== undefined) rule.priority = priority;
  if (enabled !== undefined) rule.enabled = !!enabled;
  res.json(rule);
});

router.delete('/playbook-rules/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = playbookRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const [removed] = playbookRules.splice(idx, 1);
  res.json({ deleted: true, rule: removed });
});

module.exports = router;
