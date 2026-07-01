const express = require('express');
const optionalAuth = require('../middleware/optionalAuth');
const { createRepair, listRepairs } = require('../controllers/repairController');

const router = express.Router();

router.get('/', optionalAuth, listRepairs);
router.post('/', createRepair);

module.exports = router;
