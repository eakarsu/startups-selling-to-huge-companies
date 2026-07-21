const router = require('express').Router();
const db = require('../db');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { appendAudit, digest } = require('../lib/audit');
const { transaction } = require('../lib/database');
const { probabilities, validateTransition } = require('../lib/stages');
const { InputError, date, decimal, exactKeys, id, safeError, text, version } = require('../lib/validation');

router.use(authenticate);

function respondError(res, error) {
  const safe = safeError(error);
  if (safe.status === 500) console.error(error);
  return res.status(safe.status).json(safe.body);
}

const dealSelect = `SELECT d.*, c.name AS company_name FROM deals d
  JOIN companies c ON c.id=d.company_id AND c.tenant_id=d.tenant_id`;

function dealInput(body, partial = false) {
  const allowed = ['company_id', 'title', 'value_usd', 'expected_close', 'next_action', 'arr_usd'];
  exactKeys(body, partial ? [...allowed, 'expectedVersion'] : allowed);
  const input = {};
  const include = (key) => !partial || Object.prototype.hasOwnProperty.call(body, key);
  if (include('company_id')) input.company_id = id(body.company_id, 'company_id');
  if (include('title')) input.title = text(body.title, 'title', { min: 3, max: 500 });
  if (include('value_usd')) input.value_usd = decimal(body.value_usd, 'value_usd', { optional: true });
  if (include('expected_close')) input.expected_close = date(body.expected_close, 'expected_close', { optional: true });
  if (include('next_action')) input.next_action = text(body.next_action, 'next_action', { max: 2000, optional: true });
  if (include('arr_usd')) input.arr_usd = decimal(body.arr_usd, 'arr_usd', { optional: true });
  if (partial && !Object.keys(input).length) throw new InputError('At least one editable deal field is required');
  return input;
}

async function activeCompany(client, companyId, tenantId) {
  const result = await client.query('SELECT id FROM companies WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL', [companyId, tenantId]);
  if (!result.rows[0]) throw new InputError('Company not found', 404, 'NOT_FOUND');
}

router.get('/', async (req, res) => {
  try {
    const result = await db.query(`${dealSelect} WHERE d.tenant_id=$1 AND d.archived_at IS NULL ORDER BY d.updated_at DESC, d.id DESC LIMIT 200`, [req.user.tenantId]);
    return res.json(result.rows);
  } catch (error) { return respondError(res, error); }
});

router.get('/:id/history', async (req, res) => {
  try {
    const dealResult = await db.query('SELECT id FROM deals WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL', [id(req.params.id), req.user.tenantId]);
    if (!dealResult.rows[0]) throw new InputError('Deal not found', 404, 'NOT_FOUND');
    const result = await db.query('SELECT * FROM deal_stage_transitions WHERE tenant_id=$1 AND deal_id=$2 ORDER BY created_at ASC, id ASC', [req.user.tenantId, dealResult.rows[0].id]);
    return res.json({ data: result.rows });
  } catch (error) { return respondError(res, error); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`${dealSelect} WHERE d.id=$1 AND d.tenant_id=$2 AND d.archived_at IS NULL`, [id(req.params.id), req.user.tenantId]);
    if (!result.rows[0]) throw new InputError('Deal not found', 404, 'NOT_FOUND');
    return res.json(result.rows[0]);
  } catch (error) { return respondError(res, error); }
});

router.post('/', requireRole('admin', 'seller'), async (req, res) => {
  try {
    const input = dealInput(req.body || {});
    const deal = await transaction(async (client) => {
      await activeCompany(client, input.company_id, req.user.tenantId);
      const result = await client.query(
        `INSERT INTO deals (tenant_id,company_id,title,value_usd,stage,probability,expected_close,owner_id,next_action,arr_usd)
         VALUES ($1,$2,$3,$4,'prospecting',$5,$6,$7,$8,$9) RETURNING *`,
        [req.user.tenantId, input.company_id, input.title, input.value_usd, probabilities.prospecting, input.expected_close, req.user.id, input.next_action, input.arr_usd]
      );
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'DEAL_CREATED', entity: 'deal', entityId: result.rows[0].id, payload: { companyId: input.company_id, title: input.title, stage: 'prospecting' } });
      return result.rows[0];
    });
    return res.status(201).json(deal);
  } catch (error) { return respondError(res, error); }
});

router.put('/:id', requireRole('admin', 'seller'), async (req, res) => {
  try {
    const expectedVersion = version(req.body?.expectedVersion);
    const input = dealInput(req.body || {}, true);
    const deal = await transaction(async (client) => {
      const currentResult = await client.query('SELECT * FROM deals WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL FOR UPDATE', [id(req.params.id), req.user.tenantId]);
      const current = currentResult.rows[0];
      if (!current) throw new InputError('Deal not found', 404, 'NOT_FOUND');
      if (current.version !== expectedVersion) throw new InputError('Deal version conflict', 409, 'VERSION_CONFLICT');
      if (input.company_id) await activeCompany(client, input.company_id, req.user.tenantId);
      const fields = Object.keys(input);
      const assignments = fields.map((field, index) => `${field}=$${index + 1}`);
      const result = await client.query(
        `UPDATE deals SET ${assignments.join(',')}, version=version+1, updated_at=NOW(), last_activity_at=NOW()
         WHERE id=$${fields.length + 1} AND tenant_id=$${fields.length + 2} RETURNING *`,
        [...fields.map((field) => input[field]), current.id, req.user.tenantId]
      );
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'DEAL_UPDATED', entity: 'deal', entityId: current.id, payload: { fields, version: result.rows[0].version } });
      return result.rows[0];
    });
    return res.json(deal);
  } catch (error) { return respondError(res, error); }
});

router.post('/:id/transition', requireRole('admin', 'seller'), async (req, res) => {
  try {
    exactKeys(req.body || {}, ['expectedVersion', 'toStage', 'note', 'criteria']);
    const expectedVersion = version(req.body?.expectedVersion);
    const toStage = text(req.body?.toStage, 'toStage', { max: 50 });
    const note = text(req.body?.note, 'note', { min: 5, max: 2000 });
    const idempotencyKey = text(req.get('Idempotency-Key'), 'Idempotency-Key header', { min: 16, max: 200 });
    const requestHash = digest({ dealId: id(req.params.id), expectedVersion, toStage, note, criteria: req.body?.criteria });
    const result = await transaction(async (client) => {
      const replay = await client.query('SELECT * FROM deal_stage_transitions WHERE tenant_id=$1 AND idempotency_key=$2', [req.user.tenantId, idempotencyKey]);
      if (replay.rows[0]) {
        if (replay.rows[0].request_hash !== requestHash) throw new InputError('Idempotency key was already used for a different transition', 409, 'IDEMPOTENCY_CONFLICT');
        const current = await client.query(`${dealSelect} WHERE d.id=$1 AND d.tenant_id=$2`, [replay.rows[0].deal_id, req.user.tenantId]);
        return { deal: current.rows[0], transition: replay.rows[0], replayed: true };
      }
      const currentResult = await client.query('SELECT * FROM deals WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL FOR UPDATE', [id(req.params.id), req.user.tenantId]);
      const current = currentResult.rows[0];
      if (!current) throw new InputError('Deal not found', 404, 'NOT_FOUND');
      const replayAfterLock = await client.query('SELECT * FROM deal_stage_transitions WHERE tenant_id=$1 AND idempotency_key=$2', [req.user.tenantId, idempotencyKey]);
      if (replayAfterLock.rows[0]) {
        if (replayAfterLock.rows[0].request_hash !== requestHash) throw new InputError('Idempotency key was already used for a different transition', 409, 'IDEMPOTENCY_CONFLICT');
        const joined = await client.query(`${dealSelect} WHERE d.id=$1 AND d.tenant_id=$2`, [current.id, req.user.tenantId]);
        return { deal: joined.rows[0], transition: replayAfterLock.rows[0], replayed: true };
      }
      if (current.version !== expectedVersion) throw new InputError('Deal version conflict', 409, 'VERSION_CONFLICT');
      const criteria = validateTransition(current.stage, toStage, req.user.role, req.body?.criteria);
      const nextVersion = current.version + 1;
      const transition = await client.query(
        `INSERT INTO deal_stage_transitions
         (tenant_id,deal_id,actor_id,from_stage,to_stage,note,criteria,idempotency_key,request_hash,resulting_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [req.user.tenantId, current.id, req.user.id, current.stage, toStage, note, criteria, idempotencyKey, requestHash, nextVersion]
      );
      const approvedArr = toStage === 'closed_won' ? criteria.approved_arr_usd : current.arr_usd;
      const updated = await client.query(
        `UPDATE deals SET stage=$1, probability=$2, arr_usd=$3, version=$4, updated_at=NOW(), last_activity_at=NOW()
         WHERE id=$5 AND tenant_id=$6 RETURNING *`,
        [toStage, probabilities[toStage], approvedArr, nextVersion, current.id, req.user.tenantId]
      );
      await appendAudit(client, {
        tenantId: req.user.tenantId,
        actorId: req.user.id,
        action: 'DEAL_STAGE_TRANSITIONED',
        entity: 'deal',
        entityId: current.id,
        payload: { fromStage: current.stage, toStage, version: nextVersion, transitionId: transition.rows[0].id, criteriaFields: Object.keys(criteria), requestHash },
      });
      const joined = await client.query(`${dealSelect} WHERE d.id=$1 AND d.tenant_id=$2`, [updated.rows[0].id, req.user.tenantId]);
      return { deal: joined.rows[0], transition: transition.rows[0], replayed: false };
    });
    return res.status(result.replayed ? 200 : 201).json(result);
  } catch (error) { return respondError(res, error); }
});

router.post('/:id/archive', requireRole('admin'), async (req, res) => {
  try {
    exactKeys(req.body || {}, ['expectedVersion']);
    const expectedVersion = version(req.body?.expectedVersion);
    const deal = await transaction(async (client) => {
      const currentResult = await client.query('SELECT * FROM deals WHERE id=$1 AND tenant_id=$2 AND archived_at IS NULL FOR UPDATE', [id(req.params.id), req.user.tenantId]);
      const current = currentResult.rows[0];
      if (!current) throw new InputError('Deal not found', 404, 'NOT_FOUND');
      if (current.version !== expectedVersion) throw new InputError('Deal version conflict', 409, 'VERSION_CONFLICT');
      const updated = await client.query('UPDATE deals SET archived_at=NOW(), version=version+1, updated_at=NOW() WHERE id=$1 RETURNING *', [current.id]);
      await appendAudit(client, { tenantId: req.user.tenantId, actorId: req.user.id, action: 'DEAL_ARCHIVED', entity: 'deal', entityId: current.id, payload: { version: updated.rows[0].version } });
      return updated.rows[0];
    });
    return res.json(deal);
  } catch (error) { return respondError(res, error); }
});

router.delete('/:id', (req, res) => res.status(405).json({ error: 'Deals are archived to preserve evidence', code: 'ARCHIVE_REQUIRED' }));

module.exports = router;
