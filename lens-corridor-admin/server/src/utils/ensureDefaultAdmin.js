const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const getDefaultAdminConfig = () => ({
  name: process.env.ADMIN_NAME || 'Super Admin',
  email: (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'password',
  role: process.env.ADMIN_ROLE || 'admin',
  status: 'active',
});

const ensureDefaultAdmin = async () => {
  const defaultAdmin = getDefaultAdminConfig();
  const existingAdmin = await Admin.findOne({ email: defaultAdmin.email });

  if (existingAdmin) {
    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash(defaultAdmin.password, 10);

  return Admin.create({
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    password: hashedPassword,
    role: defaultAdmin.role,
    status: defaultAdmin.status,
  });
};

module.exports = { ensureDefaultAdmin, getDefaultAdminConfig };
