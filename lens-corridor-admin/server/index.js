require('dotenv').config();

if (!globalThis.crypto) {
  globalThis.crypto = require('node:crypto').webcrypto;
}

const app = require('./src/app');
const connectDB = require('./src/config/db');
const { ensureDefaultAdmin } = require('./src/utils/ensureDefaultAdmin');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const admin = await ensureDefaultAdmin();

    console.log(`Default admin ready: ${admin.email}`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });

  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }
};

startServer();