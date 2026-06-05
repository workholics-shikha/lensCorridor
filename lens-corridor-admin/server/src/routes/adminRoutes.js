const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// POST /admin/login
router.post('/login', adminController.login);

// POST /admin/logout
router.post('/logout', adminController.logout);

// GET /admin/profile (protected)
router.get('/profile', auth, adminController.getProfile);

module.exports = router;
