const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const requireWriteAccess = require('../middleware/requireWriteAccess');
const { getMasterItems, updateMasterItem } = require('../controllers/masterController');

router.get('/:section', auth, getMasterItems);
router.put('/:section/:id', auth, requireWriteAccess, updateMasterItem);

module.exports = router;
