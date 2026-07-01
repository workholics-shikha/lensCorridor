const jwt = require('jsonwebtoken');

const Employee = require('../models/Employee');
const { isManagerUser } = require('../utils/accessScope');

const optionalAuth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');

    if (isManagerUser(decoded)) {
      const manager = await Employee.findById(decoded.id)
        .populate('store', 'storeName storeCode')
        .lean();

      if (!manager || manager.status !== 'Active') {
        return res.status(401).json({ error: 'Invalid token.' });
      }

      decoded.storeId = manager.store?._id ? manager.store._id.toString() : '';
      decoded.store = manager.store ? {
        id: manager.store._id.toString(),
        name: manager.store.storeName,
        code: manager.store.storeCode,
      } : null;
    }

    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = optionalAuth;
