const express = require('express');
const { getLensCategories } = require('../controllers/lensCategoryController');

const router = express.Router();

router.get('/', getLensCategories);

module.exports = router;
