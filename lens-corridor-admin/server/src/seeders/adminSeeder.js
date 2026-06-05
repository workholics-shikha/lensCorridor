require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { ensureDefaultAdmin, getDefaultAdminConfig } = require('../utils/ensureDefaultAdmin');

const seedAdmin = async () => {
  try {
    await connectDB();
    const defaultAdmin = getDefaultAdminConfig();
    const admin = await ensureDefaultAdmin(defaultAdmin);

    console.log(`Admin seeded: ${admin.email}`);
    process.exit(0);
  } catch (error) {
    console.error('Admin seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
};

seedAdmin();
