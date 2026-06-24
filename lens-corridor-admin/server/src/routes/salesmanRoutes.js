const express = require('express');

const auth = require('../middleware/auth');
const { listSalesmen, verifySalesmanPin } = require('../controllers/salesmanController');

const router = express.Router();

// GET /api/salesmen?storeId=<store_id>
router.get('/', listSalesmen);
router.post('/verify-pin', verifySalesmanPin);

module.exports = router;

