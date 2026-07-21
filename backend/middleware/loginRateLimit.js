const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

const keyFor = (req) => `${req.ip}|${String(req.body?.tenant || '').toLowerCase()}|${String(req.body?.email || '').toLowerCase()}`;

function checkLoginRate(req, res, next) {
  const key = keyFor(req);
  const now = Date.now();
  const state = attempts.get(key);
  if (state && state.resetAt > now && state.count >= MAX_ATTEMPTS) {
    res.set('Retry-After', String(Math.ceil((state.resetAt - now) / 1000)));
    return res.status(429).json({ error: 'Too many authentication attempts', code: 'RATE_LIMITED' });
  }
  if (state && state.resetAt <= now) attempts.delete(key);
  req.loginAttemptKey = key;
  return next();
}

function recordLoginFailure(req) {
  const key = req.loginAttemptKey || keyFor(req);
  const now = Date.now();
  const state = attempts.get(key);
  attempts.set(key, !state || state.resetAt <= now ? { count: 1, resetAt: now + WINDOW_MS } : { ...state, count: state.count + 1 });
}

function clearLoginFailures(req) {
  attempts.delete(req.loginAttemptKey || keyFor(req));
}

module.exports = { checkLoginRate, clearLoginFailures, recordLoginFailure };
