const express = require('express');
const optionalAuth = require('../middleware/optionalAuth');
const { createReturn, listReturns } = require('../controllers/returnController');

const router = express.Router();

router.get('/', optionalAuth, listReturns);
router.post('/', createReturn);

module.exports = router;
