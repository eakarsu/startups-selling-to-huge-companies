const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const db = require('../db');

const migrationsDirectory = path.join(__dirname, '..', 'migrations');
const checksum = (source) => crypto.createHash('sha256').update(source).digest('hex');

async function migrationFiles() {
  return (await fs.readdir(migrationsDirectory)).filter((name) => name.endsWith('.sql')).sort();
}

async function verifySchema(client) {
  const result = await client.query(`
    SELECT
      to_regclass('public.organizations') IS NOT NULL AS organizations,
      to_regclass('public.users') IS NOT NULL AS users,
      to_regclass('public.companies') IS NOT NULL AS companies,
      to_regclass('public.deals') IS NOT NULL AS deals,
      to_regclass('public.deal_stage_transitions') IS NOT NULL AS transitions,
      to_regclass('public.audit_events') IS NOT NULL AS audits,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='tenant_id') AS user_tenant,
      EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='version') AS deal_version,
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='audit_events_append_only' AND NOT tgisinternal) AS audit_trigger,
      EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='deal_stage_transitions_append_only' AND NOT tgisinternal) AS transition_trigger
  `);
  const missing = Object.entries(result.rows[0]).filter(([, present]) => !present).map(([name]) => name);
  if (missing.length) throw new Error(`Schema verification failed: ${missing.join(', ')}`);
}

async function migrate({ checkOnly = false } = {}) {
  const client = await db.connect();
  try {
    await client.query('SELECT pg_advisory_lock(202607200901)');
    const files = await migrationFiles();
    const ledger = await client.query(`SELECT to_regclass('public."SchemaMigrations"') IS NOT NULL AS present`);
    if (!ledger.rows[0].present) {
      if (checkOnly) throw new Error('Schema migration ledger is missing');
      await client.query(`CREATE TABLE "SchemaMigrations" (
        name TEXT PRIMARY KEY,
        checksum VARCHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
    }
    const appliedRows = await client.query('SELECT name, checksum FROM "SchemaMigrations"');
    const applied = new Map(appliedRows.rows.map((row) => [row.name, row.checksum]));
    for (const name of files) {
      const source = await fs.readFile(path.join(migrationsDirectory, name), 'utf8');
      const currentChecksum = checksum(source);
      if (applied.has(name)) {
        if (applied.get(name) !== currentChecksum) throw new Error(`Applied migration checksum changed: ${name}`);
        continue;
      }
      if (checkOnly) throw new Error(`Pending migration: ${name}`);
      await client.query('BEGIN');
      try {
        await client.query(source);
        await client.query('INSERT INTO "SchemaMigrations" (name, checksum) VALUES ($1,$2)', [name, currentChecksum]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
      console.log(`Applied ${name}`);
    }
    await verifySchema(client);
    console.log(`Schema verified; ${files.length} migration(s) current.`);
  } finally {
    await client.query('SELECT pg_advisory_unlock(202607200901)').catch(() => undefined);
    client.release();
  }
}

if (require.main === module) {
  migrate({ checkOnly: process.argv.includes('--check') })
    .then(() => db.end())
    .catch(async (error) => { console.error(error.message); await db.end().catch(() => undefined); process.exitCode = 1; });
}

module.exports = { migrate, verifySchema };
