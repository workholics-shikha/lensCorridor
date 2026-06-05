const express = require('express');
const app = express();
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const logger = require('./middleware/logger');

const defaultAllowedOrigins = [
  'http://192.168.29.202:3000',
  'http://127.0.0.1:3000',
  'http://192.168.29.202:5173',
  'http://127.0.0.1:5173',
];

const configuredOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];

const isLanOrigin = (origin = '') => {
  try {
    const { hostname, protocol } = new URL(origin);

    if (!['http:', 'https:'].includes(protocol)) {
      return false;
    }

    if (hostname === '192.168.29.202' || hostname === '127.0.0.1' || hostname === '::1') {
      return true;
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      const [first, second] = hostname.split('.').map(Number);

      return (
        first === 10 ||
        (first === 127 && second >= 0) ||
        (first === 192 && second === 168) ||
        (first === 172 && second >= 16 && second <= 31)
      );
    }

    return /^[a-z0-9.-]+$/i.test(hostname) && !hostname.includes('.');
  } catch {
    return false;
  }
};

/* =========================
   CORS
========================= */

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isLanOrigin(origin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`Origin ${origin} not allowed by CORS`)
    );
  },
  credentials: true,
}));

app.use(logger);

/* =========================
   CORP FIX
========================= */

app.use((req, res, next) => {
  res.setHeader(
    'Cross-Origin-Resource-Policy',
    'cross-origin'
  );

  next();
});

/* =========================
   HELMET
========================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

/* =========================
   BODY PARSERS
========================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILES
========================= */

app.use(
  '/uploads',
  express.static(
    path.resolve(__dirname, '../uploads')
  )
);

/* =========================
   ROUTES
========================= */

const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const masterRoutes = require('./routes/masterRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const storeRoutes = require('./routes/storeRoutes');
const salesmanRoutes = require('./routes/salesmanRoutes');
const frameShapeRoutes = require('./routes/frameShapeRoutes');
const eyeTestRoutes = require('./routes/eyeTestRoutes');
const powerTypeRoutes = require('./routes/powerTypeRoutes');
const lensCategoryRoutes = require('./routes/lensCategoryRoutes');
const orderPlacementRoutes = require('./routes/orderPlacementRoutes');
const customerRoutes = require('./routes/customerRoutes');


app.use('/api/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/salesmen', salesmanRoutes);
app.use('/api/frame-shapes', frameShapeRoutes);
app.use('/api/eye-tests', eyeTestRoutes); 
app.use('/api/power-types', powerTypeRoutes);
app.use('/api/lens-categories', lensCategoryRoutes);
app.use('/api/order-placement', orderPlacementRoutes);
app.use('/api/customers', customerRoutes);

/* =========================
   HEALTH CHECK
========================= */

app.get('/', (req, res) => {
  res.json({ message: 'API is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Lens Corridor API is running',
  });
});

/* =========================
   404
========================= */

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* =========================
   ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error(err.stack);

  const isProd =
    process.env.NODE_ENV === 'production';

  if (isProd) {
    res.status(500).json({
      error: 'Something went wrong!',
    });
    return;
  }

  res.status(500).json({
    error: 'Something went wrong!',
    message: err?.message,
  });
});

module.exports = app;
