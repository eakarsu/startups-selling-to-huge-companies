const crypto = require('node:crypto');

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

const digest = (value) => crypto.createHash('sha256').update(canonical(value)).digest('hex');

async function appendAudit(client, { tenantId, actorId, action, entity, entityId = null, payload = {} }) {
  await client.query('SELECT id FROM organizations WHERE id = $1 FOR UPDATE', [tenantId]);
  const previousResult = await client.query('SELECT sequence, hash FROM audit_events WHERE tenant_id = $1 ORDER BY sequence DESC LIMIT 1', [tenantId]);
  const previous = previousResult.rows[0];
  const sequence = Number(previous?.sequence || 0) + 1;
  const previousHash = previous?.hash || 'GENESIS';
  const occurredAt = new Date();
  const hash = digest({ tenantId, actorId, sequence, action, entity, entityId, payload, previousHash, occurredAt: occurredAt.toISOString() });
  const result = await client.query(
    `INSERT INTO audit_events (tenant_id, actor_id, sequence, action, entity, entity_id, payload, previous_hash, hash, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [tenantId, actorId, sequence, action, entity, entityId, payload, previousHash, hash, occurredAt]
  );
  return result.rows[0];
}

function verifyAudit(events) {
  let previousHash = 'GENESIS';
  for (const event of events) {
    const expected = digest({
      tenantId: event.tenant_id,
      actorId: event.actor_id,
      sequence: event.sequence,
      action: event.action,
      entity: event.entity,
      entityId: event.entity_id,
      payload: event.payload,
      previousHash,
      occurredAt: new Date(event.created_at).toISOString(),
    });
    if (event.previous_hash !== previousHash || event.hash !== expected) return false;
    previousHash = event.hash;
  }
  return true;
}

module.exports = { appendAudit, canonical, digest, verifyAudit };
