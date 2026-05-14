const router = require('express').Router();
const auth = require('../middleware/auth');
const db = require('../db');

async function logAudit(req, action, entity, entity_id, details) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, user_email, action, entity, entity_id, details, ip) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [req.user?.id || null, req.user?.email || null, action, entity, entity_id, details, req.ip || null]
    );
  } catch (e) { /* don't break primary action */ }
}

// CSV cell escaping — handle commas, quotes, newlines per RFC 4180
function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function toCsv(rows, columns) {
  const head = columns.join(',');
  const body = rows.map(r => columns.map(c => csvCell(r[c])).join(',')).join('\n');
  return head + '\n' + body + '\n';
}

const EXPORTABLE = {
  deals: {
    sql: 'SELECT d.id, c.name AS company_name, d.title, d.value_usd, d.arr_usd, d.stage, d.probability, d.expected_close, d.next_action, d.created_at, d.last_activity_at FROM deals d JOIN companies c ON d.company_id = c.id ORDER BY d.value_usd DESC NULLS LAST',
    columns: ['id','company_name','title','value_usd','arr_usd','stage','probability','expected_close','next_action','created_at','last_activity_at']
  },
  companies: {
    sql: 'SELECT id, name, industry, revenue_billions, employee_count, tier, website, hq_city, hq_country, stock_symbol, founded_year FROM companies ORDER BY revenue_billions DESC NULLS LAST',
    columns: ['id','name','industry','revenue_billions','employee_count','tier','website','hq_city','hq_country','stock_symbol','founded_year']
  },
  contacts: {
    sql: 'SELECT ct.id, c.name AS company_name, ct.name, ct.title, ct.email, ct.phone, ct.linkedin, ct.decision_maker, ct.relationship_strength, ct.last_contacted FROM contacts ct LEFT JOIN companies c ON ct.company_id = c.id ORDER BY ct.id',
    columns: ['id','company_name','name','title','email','phone','linkedin','decision_maker','relationship_strength','last_contacted']
  },
  activities: {
    sql: 'SELECT a.id, d.title AS deal_title, ct.name AS contact_name, a.activity_type, a.subject, a.outcome, a.scheduled_at, a.completed_at, a.duration_mins FROM activities a LEFT JOIN deals d ON a.deal_id = d.id LEFT JOIN contacts ct ON a.contact_id = ct.id ORDER BY a.scheduled_at DESC NULLS LAST',
    columns: ['id','deal_title','contact_name','activity_type','subject','outcome','scheduled_at','completed_at','duration_mins']
  }
};

// CSV export — /api/utils/export/:entity?format=csv
router.get('/export/:entity', auth, async (req, res) => {
  try {
    const e = EXPORTABLE[req.params.entity];
    if (!e) return res.status(400).json({ error: 'Unknown entity. Allowed: deals, companies, contacts, activities' });
    const result = await db.query(e.sql);
    const csv = toCsv(result.rows, e.columns);
    await logAudit(req, 'export', req.params.entity, null, `csv rows=${result.rows.length}`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.entity}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search & filter — /api/utils/search?q=&entity=deals&stage=&min_value=&max_value=&industry=
router.get('/search', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const entity = (req.query.entity || 'all').toString();
    const out = {};

    const like = q ? `%${q}%` : null;
    const dealsParts = ['SELECT d.*, c.name AS company_name FROM deals d JOIN companies c ON d.company_id = c.id WHERE 1=1'];
    const dealParams = [];
    if (q) { dealParams.push(like); dealsParts.push(`AND (d.title ILIKE $${dealParams.length} OR c.name ILIKE $${dealParams.length} OR d.next_action ILIKE $${dealParams.length})`); }
    if (req.query.stage) { dealParams.push(req.query.stage); dealsParts.push(`AND d.stage = $${dealParams.length}`); }
    if (req.query.min_value) { dealParams.push(Number(req.query.min_value)); dealsParts.push(`AND d.value_usd >= $${dealParams.length}`); }
    if (req.query.max_value) { dealParams.push(Number(req.query.max_value)); dealsParts.push(`AND d.value_usd <= $${dealParams.length}`); }
    if (req.query.min_probability) { dealParams.push(Number(req.query.min_probability)); dealsParts.push(`AND d.probability >= $${dealParams.length}`); }
    dealsParts.push('ORDER BY d.value_usd DESC NULLS LAST LIMIT 50');

    const compParts = ['SELECT * FROM companies WHERE 1=1'];
    const compParams = [];
    if (q) { compParams.push(like); compParts.push(`AND (name ILIKE $${compParams.length} OR industry ILIKE $${compParams.length} OR notes ILIKE $${compParams.length})`); }
    if (req.query.industry) { compParams.push(req.query.industry); compParts.push(`AND industry ILIKE $${compParams.length}`); }
    if (req.query.tier) { compParams.push(req.query.tier); compParts.push(`AND tier = $${compParams.length}`); }
    compParts.push('ORDER BY revenue_billions DESC NULLS LAST LIMIT 50');

    const ctParts = ['SELECT ct.*, c.name AS company_name FROM contacts ct LEFT JOIN companies c ON ct.company_id = c.id WHERE 1=1'];
    const ctParams = [];
    if (q) { ctParams.push(like); ctParts.push(`AND (ct.name ILIKE $${ctParams.length} OR ct.title ILIKE $${ctParams.length} OR ct.email ILIKE $${ctParams.length} OR c.name ILIKE $${ctParams.length})`); }
    if (req.query.decision_maker === 'true') { ctParts.push('AND ct.decision_maker = TRUE'); }
    if (req.query.relationship_strength) { ctParams.push(req.query.relationship_strength); ctParts.push(`AND ct.relationship_strength = $${ctParams.length}`); }
    ctParts.push('ORDER BY ct.id LIMIT 50');

    if (entity === 'all' || entity === 'deals') {
      const r = await db.query(dealsParts.join(' '), dealParams);
      out.deals = r.rows;
    }
    if (entity === 'all' || entity === 'companies') {
      const r = await db.query(compParts.join(' '), compParams);
      out.companies = r.rows;
    }
    if (entity === 'all' || entity === 'contacts') {
      const r = await db.query(ctParts.join(' '), ctParams);
      out.contacts = r.rows;
    }
    await logAudit(req, 'search', entity, null, `q="${q}"`);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit log — list with optional filters
router.get('/audit', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const parts = ['SELECT * FROM audit_logs WHERE 1=1'];
    const params = [];
    if (req.query.action) { params.push(req.query.action); parts.push(`AND action = $${params.length}`); }
    if (req.query.entity) { params.push(req.query.entity); parts.push(`AND entity = $${params.length}`); }
    if (req.query.user_email) { params.push(`%${req.query.user_email}%`); parts.push(`AND user_email ILIKE $${params.length}`); }
    parts.push(`ORDER BY created_at DESC LIMIT ${limit}`);
    const result = await db.query(parts.join(' '), params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual audit log writer (frontend-emitted significant events)
router.post('/audit', auth, async (req, res) => {
  try {
    const { action, entity, entity_id, details } = req.body || {};
    if (!action) return res.status(400).json({ error: 'action is required' });
    await logAudit(req, action, entity || null, entity_id || null, details || null);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
