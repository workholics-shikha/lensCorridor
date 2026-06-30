const express = require('express');
const { createRepair, listRepairs } = require('../controllers/repairController');

const router = express.Router();

router.get('/', listRepairs);
router.post('/', createRepair);

module.exports = router;
