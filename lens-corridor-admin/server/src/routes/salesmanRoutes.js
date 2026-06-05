const express = require('express');

const auth = require('../middleware/auth');
const { listSalesmen } = require('../controllers/salesmanController');

const router = express.Router();

// GET /api/salesmen?storeId=<store_id>
router.get('/', listSalesmen);

module.exports = router;

