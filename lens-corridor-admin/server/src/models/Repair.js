const mongoose = require('mongoose');

const repairSchema = new mongoose.Schema({
  referenceNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'AppOrderPlacement', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  salesperson: {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    employeeId: { type: String, default: '' },
  },
  customerName: { type: String, default: '' },
  customerPhone: { type: String, default: '' },
  repairScope: {
    type: String,
    enum: ['frame', 'lens', 'full-product', 'fitting', 'other'],
    default: 'full-product',
  },
  issueType: { type: String, required: true },
  remarks: { type: String, default: '' },
  estimatedAmount: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  expectedDeliveryDate: { type: Date, default: null },
  orderSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  status: {
    type: String,
    enum: ['Requested', 'In Progress', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Requested',
  },
}, { timestamps: true });

module.exports = mongoose.model('Repair', repairSchema);
