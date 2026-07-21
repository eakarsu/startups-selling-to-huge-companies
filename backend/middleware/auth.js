const jwt = require('jsonwebtoken');
const db = require('../db');

module.exports = async function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  try {
    const claims = jwt.verify(authorization.slice(7), process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: 'enterpriseos-api',
      audience: 'enterpriseos-client',
    });
    const userId = Number(claims.sub);
    if (!Number.isSafeInteger(userId) || !Number.isSafeInteger(claims.tenantId)) throw new Error('Invalid identity claims');
    const result = await db.query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.role
       FROM users u JOIN organizations o ON o.id=u.tenant_id
       WHERE u.id=$1 AND u.tenant_id=$2 AND u.is_active=TRUE AND o.is_active=TRUE`,
      [userId, claims.tenantId]
    );
    if (!result.rows[0]) throw new Error('Inactive identity');
    req.user = {
      id: result.rows[0].id,
      tenantId: result.rows[0].tenant_id,
      email: result.rows[0].email,
      name: result.rows[0].name,
      role: result.rows[0].role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
};
