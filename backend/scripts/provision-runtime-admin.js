require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');

async function main() {
  const slug = String(process.env.BOOTSTRAP_TENANT_SLUG || 'runtime-tenant').trim().toLowerCase();
  const tenantName = String(process.env.BOOTSTRAP_TENANT_NAME || 'Runtime Acceptance Tenant').trim();
  const email = String(process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator').trim();
  if (!email || password.length < 12) throw new Error('Acceptance administrator credentials are required');
  const hash = await bcrypt.hash(password, 12);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const organization = await client.query(
      `INSERT INTO organizations (slug, name, is_active) VALUES ($1,$2,TRUE)
       ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, is_active=TRUE, updated_at=NOW() RETURNING id`,
      [slug, tenantName]
    );
    await client.query(
      `INSERT INTO users (tenant_id,email,password_hash,name,role,is_active) VALUES ($1,$2,$3,$4,'admin',TRUE)
       ON CONFLICT (tenant_id, (lower(email))) DO UPDATE SET password_hash=EXCLUDED.password_hash,
         name=EXCLUDED.name, role='admin', is_active=TRUE, updated_at=NOW()`,
      [organization.rows[0].id, email, hash, name]
    );
    await client.query('COMMIT');
    console.log(`EnterpriseOS runtime administrator ready: ${email}`);
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => db.end());
