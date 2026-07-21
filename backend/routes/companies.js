const router = require('express').Router();
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { appendAudit } = require('../lib/audit');
const { transaction } = require('../lib/database');
const { InputError, choice, decimal, exactKeys, id, integer, safeError, text, version } = require('../lib/validation');

router.use(authenticate);

function respondError(res, error) {
  const safe = safeError(error);
  if (safe.status === 500) console.error(error);
  return res.status(safe.status).json(safe.body);
}

function optionalWebsite(value) {
  const normalized = text(value, 'website', { max: 2048, optional: true });
  if (!normalized) return null;
  let url;
  try { url = new URL(normalized); } catch { throw new InputError('website must be an absolute HTTP(S) URL'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new InputError('website must be an absolute HTTP(S) URL');
  return url.toString();
}

function companyInput(body, partial = false) {
  const allowed = ['name', 'industry', 'revenue_billions', 'employee_count', 'tier', 'website', 'hq_city', 'hq_country', 'stock_symbol', 'founded_year', 'notes'];
  exactKeys(body, partial ? [...allowed, 'expectedVersion'] : allowed);
  const input = {};
  const include = (key) => !partial || Object.prototype.hasOwnProperty.call(body, key);
  if (include('name')) input.name = text(body.name, 'name', { min: 2, max: 255 });
  if (include('industry')) input.industry = text(body.industry, 'industry', { max: 100, optional: true });
  if (include('revenue_billions')) input.revenue_billions = decimal(body.revenue_billions, 'revenue_billions', { min: 0, max: 100000, optional: true });
  if (include('employee_count')) input.employee_count = integer(body.employee_count, 'employee_count', { min: 0, max: 10_000_000, optional: true });
  if (include('tier')) input.tier = choice(body.tier, 'tier', ['F10', 'F50', 'F100', 'F500', 'Fortune1000'], 'F500');
  if (include('website')) input.website = optionalWebsite(body.website);
  if (include('hq_city')) input.hq_city = text(body.hq_city, 'hq_city', { max: 100, optional: true });
  if (include('hq_country')) input.hq_country = text(body.hq_country, 'hq_country', { max: 100, optional: true });
  if (include('stock_symbol')) input.stock_symbol = text(body.stock_symbol, 'stock_symbol', { max: 20, optional: true })?.toUpperCase() || null;
  if (include('founded_year')) input.founded_year = integer(body.founded_year, 'founded_year', { min: 1700, max: new Date().getUTCFullYear() + 1, optional: true });
  if (include('notes')) input.notes = text(body.notes, 'notes', { max: 5000, optional: true });
  if (partial && !Object.keys(input).length) throw new InputError('At least one editable company field is required');
  return input;
}

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM companies WHERE tenant_id=$1 AND archived_at IS NULL ORDER BY updated_at DESC, id DESC LIMIT 200',
      [req.user.tenantId]
    );
    return res.json(result.rows);
  } catch (error) { return respondError(res, error); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM companies WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL', [id(req.params.id), req.user.tenantId]);
    if (!result.rows[0]) throw new InputError('Company not found', 404, 'NOT_FOUND');
    return res.json(result.rows[0]);
  } catch (error) { return respondError(res, error); }
});

router.post('/', requireRole('admin', 'seller'), async (req, res) => {
  try {
    const input = companyInput(req.body || {});
    const company = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO companies (tenant_id,name,industry,revenue_billions,employee_count,tier,website,hq_city,hq_country,stock_symbol,founded_year,notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [req.user.tenantId, input.name, input.industry, input.revenue_billions, input.employee_count, input.tier, input.website, input.hq_city, input.hq_country, input.stock_symbol, input.founded_year, input.notes]
      );
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'COMPANY_CREATED', entity: 'company', entityId: result.rows[0].id, payload: { name: input.name, tier: input.tier } });
      return result.rows[0];
    });
    return res.status(201).json(company);
  } catch (error) { return respondError(res, error); }
});

router.put('/:id', requireRole('admin', 'seller'), async (req, res) => {
  try {
    const expectedVersion = version(req.body?.expectedVersion);
    const input = companyInput(req.body || {}, true);
    const company = await transaction(async (client) => {
      const currentResult = await client.query('SELECT * FROM companies WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL FOR UPDATE', [id(req.params.id), req.user.tenantId]);
      const current = currentResult.rows[0];
      if (!current) throw new InputError('Company not found', 404, 'NOT_FOUND');
      if (current.version !== expectedVersion) throw new InputError('Company version conflict', 409, 'VERSION_CONFLICT');
      const fields = Object.keys(input);
      const assignments = fields.map((field, index) => `${field}=$${index + 1}`);
      const result = await client.query(
        `UPDATE companies SET ${assignments.join(',')}, version=version+1, updated_at=NOW() WHERE id=$${fields.length + 1} AND tenant_id=$${fields.length + 2} RETURNING *`,
        [...fields.map((field) => input[field]), current.id, req.user.tenantId]
      );
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'COMPANY_UPDATED', entity: 'company', entityId: current.id, payload: { fields, version: result.rows[0].version } });
      return result.rows[0];
    });
    return res.json(company);
  } catch (error) { return respondError(res, error); }
});

router.post('/:id/archive', requireRole('admin'), async (req, res) => {
  try {
    exactKeys(req.body || {}, ['expectedVersion']);
    const expectedVersion = version(req.body?.expectedVersion);
    const company = await transaction(async (client) => {
      const currentResult = await client.query('SELECT * FROM companies WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL FOR UPDATE', [id(req.params.id), req.user.tenantId]);
      const current = currentResult.rows[0];
      if (!current) throw new InputError('Company not found', 404, 'NOT_FOUND');
      if (current.version !== expectedVersion) throw new InputError('Company version conflict', 409, 'VERSION_CONFLICT');
      const activeDeals = await client.query('SELECT COUNT(*)::int AS count FROM deals WHERE tenant_id=$1 AND company_id=$2 AND archived_at IS NULL', [req.user.tenantId, current.id]);
      if (activeDeals.rows[0].count > 0) throw new InputError('Archive the company deals first', 409, 'ACTIVE_DEALS');
      const result = await client.query('UPDATE companies SET archived_at=NOW(), version=version+1, updated_at=NOW() WHERE id=$1 RETURNING *', [current.id]);
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'COMPANY_ARCHIVED', entity: 'company', entityId: current.id, payload: { version: result.rows[0].version } });
      return result.rows[0];
    });
    return res.json(company);
  } catch (error) { return respondError(res, error); }
});

router.delete('/:id', (req, res) => res.status(405).json({ error: 'Companies are archived to preserve evidence', code: 'ARCHIVE_REQUIRED' }));

module.exports = router;
