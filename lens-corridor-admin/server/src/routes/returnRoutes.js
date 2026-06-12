const express = require('express');
const { createReturn, listReturns } = require('../controllers/returnController');

const router = express.Router();

router.get('/', listReturns);
router.post('/', createReturn);

module.exports = router;
