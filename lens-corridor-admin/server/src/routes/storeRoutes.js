const express = require('express');

const auth = require('../middleware/auth');
const requireWriteAccess = require('../middleware/requireWriteAccess');
const { listStores, createStore, updateStore, deleteStore } = require('../controllers/storeController');

const router = express.Router();

router.get('/', listStores);
router.post('/', auth, requireWriteAccess, createStore);
router.put('/:id', auth, requireWriteAccess, updateStore);
router.delete('/:id', auth, requireWriteAccess, deleteStore);

module.exports = router;
