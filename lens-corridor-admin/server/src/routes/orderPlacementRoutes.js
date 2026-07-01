const express = require('express');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const requireWriteAccess = require('../middleware/requireWriteAccess');
const {
  createOrderPlacement,
  listOrderPlacements,
  getOrderPlacementById,
  updateOrderPlacementStatus,
  updateOrderPlacementBilling,
} = require('../controllers/orderPlacementController');

const router = express.Router();

router.get('/', optionalAuth, listOrderPlacements);
router.get('/:id', optionalAuth, getOrderPlacementById);
router.post('/', createOrderPlacement);
router.patch('/:id/status', auth, updateOrderPlacementStatus);
router.patch('/:id/billing', auth, requireWriteAccess, updateOrderPlacementBilling);

module.exports = router;
