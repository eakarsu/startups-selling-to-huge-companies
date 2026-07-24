const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authenticate = require('../middleware/auth');
const { checkLoginRate, clearLoginFailures, recordLoginFailure } = require('../middleware/loginRateLimit');
const { exactKeys, text } = require('../lib/validation');

const dummyHash = '$2a$12$M7Z.W.8oNfHvc4ZcvWfZzO.J22hQQzF4W2B1qCxkeNu2PMSFXO6Yu';
const tokenOptions = { algorithm: 'HS256', expiresIn: '1h', issuer: 'enterpriseos-api', audience: 'enterpriseos-client' };
const publicUser = (user) => ({ id: user.id, tenantId: user.tenant_id ?? user.tenantId, email: user.email, name: user.name, role: user.role });

router.post('/login', checkLoginRate, async (req, res) => {
  try {
    exactKeys(req.body || {}, ['tenant', 'email', 'password']);
    const tenant = text(req.body?.tenant || process.env.BOOTSTRAP_TENANT_SLUG || 'runtime-tenant', 'tenant', { min: 1, max: 80 }).toLowerCase();
    const email = text(req.body?.email, 'email', { min: 3, max: 254 }).toLowerCase();
    const password = String(req.body?.password || '');
    const result = await db.query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.password_hash
       FROM users u JOIN organizations o ON o.id=u.tenant_id
       WHERE o.slug=$1 AND LOWER(u.email)=$2 AND u.is_active=TRUE AND o.is_active=TRUE`,
      [tenant, email]
    );
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user?.password_hash || dummyHash);
    if (!user || !valid) {
      recordLoginFailure(req);
      return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }
    clearLoginFailures(req);
    const token = jwt.sign({ tenantId: user.tenant_id, role: user.role }, process.env.JWT_SECRET, { ...tokenOptions, subject: String(user.id) });
    return res.json({ token, user: publicUser(user) });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message, code: error.code });
    console.error(error);
    return res.status(500).json({ error: 'Authentication failed', code: 'LOGIN_FAILED' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
