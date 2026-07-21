const db = require('../db');
const { bootstrap } = require('./bootstrap-tenant');

function requireDisposableRuntime() {
  if (process.env.NODE_ENV !== 'test' || process.env.ALLOW_DISPOSABLE_SEED !== 'YES') {
    throw new Error('create-admin is restricted to an acknowledged disposable test runtime');
  }
  const database = new URL(process.env.DATABASE_URL || '');
  if (!['127.0.0.1', 'localhost', '::1'].includes(database.hostname)) {
    throw new Error('create-admin requires a loopback database');
  }
  process.env.ALLOW_TENANT_BOOTSTRAP = 'YES';
}

requireDisposableRuntime();
bootstrap()
  .then(() => db.end())
  .catch(async (error) => {
    console.error(error.message);
    await db.end().catch(() => undefined);
    process.exitCode = 1;
  });
