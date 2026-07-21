require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../db');
const { migrate } = require('./migrate');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const strongPassword = (value) => value.length >= 14 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);

async function bootstrap() {
  if (process.env.ALLOW_TENANT_BOOTSTRAP !== 'YES') throw new Error('Set ALLOW_TENANT_BOOTSTRAP=YES for this one explicit provisioning operation');
  const slug = String(process.env.BOOTSTRAP_TENANT_SLUG || '').trim().toLowerCase();
  const tenantName = String(process.env.BOOTSTRAP_TENANT_NAME || '').trim();
  const email = String(process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const name = String(process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
  const password = String(process.env.BOOTSTRAP_ADMIN_PASSWORD || '');
  if (!slugPattern.test(slug) || slug.length > 80) throw new Error('BOOTSTRAP_TENANT_SLUG must be a lowercase URL-safe slug');
  if (tenantName.length < 2 || tenantName.length > 200) throw new Error('BOOTSTRAP_TENANT_NAME must be 2-200 characters');
  if (!emailPattern.test(email) || email.length > 254) throw new Error('BOOTSTRAP_ADMIN_EMAIL must be valid');
  if (name.length < 2 || name.length > 200) throw new Error('BOOTSTRAP_ADMIN_NAME must be 2-200 characters');
  if (!strongPassword(password)) throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be 14-128 characters with upper, lower, number, and symbol');
  await migrate({ checkOnly: true });
  const hash = await bcrypt.hash(password, 12);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const organization = await client.query(
      'INSERT INTO organizations (slug, name) VALUES ($1,$2) RETURNING id, slug, name',
      [slug, tenantName]
    );
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role, is_active)
       VALUES ($1,$2,$3,$4,'admin',TRUE)`,
      [organization.rows[0].id, email, hash, name]
    );
    await client.query('COMMIT');
    console.log(`Provisioned tenant ${organization.rows[0].slug} with one administrator.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  bootstrap().then(() => db.end()).catch(async (error) => { console.error(error.message); await db.end().catch(() => undefined); process.exitCode = 1; });
}

module.exports = { bootstrap, strongPassword };
