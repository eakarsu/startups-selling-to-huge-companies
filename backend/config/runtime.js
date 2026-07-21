const { URL } = require('node:url');

const placeholder = /^(?:change-me|replace-with|your-|example|dev-secret)/i;

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function port(name, fallback) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${name} must be an integer from 1 through 65535`);
  return value;
}

function validateRuntime() {
  const databaseUrl = required('DATABASE_URL');
  const jwtSecret = required('JWT_SECRET');
  const corsOrigin = required('CORS_ORIGIN');
  if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) throw new Error('DATABASE_URL must be a PostgreSQL URL');
  if (jwtSecret.length < 32 || placeholder.test(jwtSecret)) throw new Error('JWT_SECRET must be a non-placeholder secret of at least 32 characters');
  let origin;
  try { origin = new URL(corsOrigin); } catch { throw new Error('CORS_ORIGIN must be an absolute HTTP(S) origin'); }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== corsOrigin || corsOrigin === '*') {
    throw new Error('CORS_ORIGIN must be one explicit HTTP(S) origin');
  }
  return { databaseUrl, jwtSecret, corsOrigin, port: port('PORT', 3014) };
}

module.exports = { port, validateRuntime };
