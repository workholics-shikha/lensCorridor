const normalizeRole = (value = '') => String(value).trim().toLowerCase();

const requireWriteAccess = (req, res, next) => {
  const role = normalizeRole(req.user?.role);

  if (role === 'manager') {
    return res.status(403).json({
      error: 'Managers have view-only access.',
    });
  }

  return next();
};

module.exports = requireWriteAccess;
