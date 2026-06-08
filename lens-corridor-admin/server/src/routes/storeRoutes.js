const express = require('express');

const auth = require('../middleware/auth');
const { listStores, createStore, deleteStore } = require('../controllers/storeController');

const router = express.Router();

router.get('/', listStores);
router.post('/', auth, createStore);
router.delete('/:id', auth, deleteStore);

module.exports = router;
