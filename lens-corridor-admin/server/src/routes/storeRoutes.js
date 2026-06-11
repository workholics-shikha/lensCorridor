const express = require('express');

const auth = require('../middleware/auth');
const { listStores, createStore, updateStore, deleteStore } = require('../controllers/storeController');

const router = express.Router();

router.get('/', listStores);
router.post('/', auth, createStore);
router.put('/:id', auth, updateStore);
router.delete('/:id', auth, deleteStore);

module.exports = router;
