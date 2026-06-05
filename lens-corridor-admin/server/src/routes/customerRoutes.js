const express = require('express');

const auth = require('../middleware/auth');
const { listCustomers } = require('../controllers/customerController');

const router = express.Router();

router.get('/', auth, listCustomers);

module.exports = router;
