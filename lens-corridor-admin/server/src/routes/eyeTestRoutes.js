const express = require('express');
const router  = express.Router();
const {
  createEyeTest,
  getAllEyeTests,
  getEyeTestById,
} = require('../controllers/eyeTestController');

router.post('/',    createEyeTest);
router.get('/',     getAllEyeTests);
router.get('/:id',  getEyeTestById);

module.exports = router;