const express = require('express');
const router = express.Router();
const {
  getAllPowerTypes,
  getPowerTypeById,
} = require('../controllers/powerTypeController');

router.get('/',     getAllPowerTypes);
router.get('/:id',  getPowerTypeById);

module.exports = router;