const express = require('express');

const auth = require('../middleware/auth');
const requireWriteAccess = require('../middleware/requireWriteAccess');
const {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');

const router = express.Router();

router.get('/', auth, listEmployees);
router.post('/', auth, requireWriteAccess, createEmployee);
router.put('/:id', auth, requireWriteAccess, updateEmployee);
router.delete('/:id', auth, requireWriteAccess, deleteEmployee);

module.exports = router;
