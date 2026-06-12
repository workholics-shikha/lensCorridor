const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const normalizeAdminEmail = (value = '') => {
  const input = String(value || '').trim();
  const markdownMatch = input.match(/\[([^\]]+)\]\(mailto:([^)]+)\)/i);

  if (markdownMatch) {
    return (markdownMatch[2] || markdownMatch[1] || '').trim().toLowerCase();
  }

  return input.replace(/^mailto:/i, '').trim().toLowerCase();
};

const getDefaultAdminConfig = () => ({
  name: process.env.ADMIN_NAME || 'Super Admin',
  email: normalizeAdminEmail(process.env.ADMIN_EMAIL || 'admin@example.com'),
  password: process.env.ADMIN_PASSWORD || 'password',
  role: process.env.ADMIN_ROLE || 'admin',
  status: 'active',
});

const ensureDefaultAdmin = async () => {
  const defaultAdmin = getDefaultAdminConfig();
  const configuredEmail = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase();
  const candidateEmails = [...new Set([
    defaultAdmin.email,
    configuredEmail,
    configuredEmail.replace(/^mailto:/i, ''),
  ].filter(Boolean))];
  const existingAdmin = await Admin.findOne({ email: { $in: candidateEmails } });

  if (existingAdmin) {
    let shouldSave = false;

    if (existingAdmin.email !== defaultAdmin.email) {
      existingAdmin.email = defaultAdmin.email;
      shouldSave = true;
    }

    if (!existingAdmin.name && defaultAdmin.name) {
      existingAdmin.name = defaultAdmin.name;
      shouldSave = true;
    }

    if (!existingAdmin.role && defaultAdmin.role) {
      existingAdmin.role = defaultAdmin.role;
      shouldSave = true;
    }

    if (existingAdmin.status !== 'active') {
      existingAdmin.status = 'active';
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
    }

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

module.exports = { ensureDefaultAdmin, getDefaultAdminConfig, normalizeAdminEmail };
