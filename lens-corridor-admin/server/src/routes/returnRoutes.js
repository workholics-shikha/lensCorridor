const express = require('express');
const { listReturns } = require('../controllers/returnController');

const router = express.Router();

router.get('/', listReturns);

module.exports = router;
