module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'This action requires a different role', code: 'ROLE_REQUIRED' });
  return next();
};
