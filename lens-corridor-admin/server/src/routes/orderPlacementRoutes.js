const express = require('express');
const {
  createOrderPlacement,
  listOrderPlacements,
  getOrderPlacementById,
  updateOrderPlacementStatus,
  updateOrderPlacementBilling,
} = require('../controllers/orderPlacementController');

const router = express.Router();

router.get('/', listOrderPlacements);
router.get('/:id', getOrderPlacementById);
router.post('/', createOrderPlacement);
router.patch('/:id/status', updateOrderPlacementStatus);
router.patch('/:id/billing', updateOrderPlacementBilling);

module.exports = router;
