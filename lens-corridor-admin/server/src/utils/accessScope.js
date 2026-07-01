const mongoose = require('mongoose');

const normalizeRole = (value = '') => String(value).trim().toLowerCase();

const isManagerUser = (user) => normalizeRole(user?.role) === 'manager';

const getAssignedStoreId = (user) => {
  const candidate = user?.store?.id || user?.storeId || '';
  return String(candidate).trim();
};

const resolveObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const buildManagerStoreFilter = (user, ...fieldNames) => {
  if (!isManagerUser(user)) {
    return {};
  }

  const storeId = getAssignedStoreId(user);
  if (!storeId) {
    return { _id: null };
  }

  const objectId = resolveObjectId(storeId);
  const conditions = fieldNames
    .filter(Boolean)
    .map((fieldName) => (
      objectId
        ? { [fieldName]: objectId }
        : { [fieldName]: storeId }
    ));

  if (conditions.length === 0) {
    return { _id: null };
  }

  return conditions.length === 1 ? conditions[0] : { $or: conditions };
};

module.exports = {
  normalizeRole,
  isManagerUser,
  getAssignedStoreId,
  resolveObjectId,
  buildManagerStoreFilter,
};
