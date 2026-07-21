class InputError extends Error {
  constructor(message, status = 400, code = 'INVALID_INPUT') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function object(value, name = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InputError(`${name} must be an object`);
  return value;
}

function exactKeys(value, allowed) {
  object(value);
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length) throw new InputError(`Unexpected field(s): ${unexpected.join(', ')}`);
}

function text(value, name, { min = 1, max = 500, optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  if (typeof value !== 'string') throw new InputError(`${name} must be text`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw new InputError(`${name} must be ${min}-${max} characters`);
  return normalized;
}

function integer(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER, optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  const normalized = Number(value);
  if (!Number.isSafeInteger(normalized) || normalized < min || normalized > max) throw new InputError(`${name} must be an integer from ${min} through ${max}`);
  return normalized;
}

const id = (value, name = 'id') => integer(value, name, { min: 1 });
const version = (value) => integer(value, 'expectedVersion', { min: 0 });

function decimal(value, name, { min = 0, max = 1_000_000_000_000, optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  const normalized = Number(value);
  if (!Number.isFinite(normalized) || normalized < min || normalized > max) throw new InputError(`${name} must be a number from ${min} through ${max}`);
  return normalized;
}

function choice(value, name, allowed, fallback) {
  const normalized = value === undefined && fallback !== undefined ? fallback : value;
  if (!allowed.includes(normalized)) throw new InputError(`${name} must be one of: ${allowed.join(', ')}`);
  return normalized;
}

function date(value, name, { optional = false } = {}) {
  if ((value === undefined || value === null || value === '') && optional) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new InputError(`${name} must be an ISO date (YYYY-MM-DD)`);
  }
  return value;
}

function safeError(error) {
  if (error instanceof InputError) return { status: error.status, body: { error: error.message, code: error.code } };
  if (error?.code === '23505') return { status: 409, body: { error: 'A record with that identity already exists', code: 'CONFLICT' } };
  if (error?.code === '23503' || error?.code === '23514') return { status: 409, body: { error: 'The requested change violates workflow rules', code: 'WORKFLOW_CONFLICT' } };
  return { status: 500, body: { error: 'Internal server error', code: 'INTERNAL_ERROR' } };
}

module.exports = { InputError, choice, date, decimal, exactKeys, id, integer, object, safeError, text, version };
