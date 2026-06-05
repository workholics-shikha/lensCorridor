const mongoose = require('mongoose');

const frameImageSchema = new mongoose.Schema({
  id: { type: String },
  image: { type: String },
  shape: { type: String },
}, { _id: false });

const lensDetailSchema = new mongoose.Schema({
  id: { type: String },
  label: { type: String },
  eye: { type: String, enum: ['left', 'right'] },
  sph: { type: String, default: '' },
  cyl: { type: String, default: '' },
  axis: { type: String, default: '' },
  add: { type: String, default: '' },
}, { _id: false });

const appOrderPlacementSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, index: true },
  invoiceDate: { type: Date, required: true },
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', index: true },
  customer: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
  },
  frame: {
    selectedShape: { type: String, default: '' },
    price: { type: Number, default: 0 },
    images: { type: [frameImageSchema], default: [] },
  },
  lensSelection: {
    lensType: { type: String, default: '' },
    lensCategory: { type: String, default: '' },
    lensCategoryId: { type: String, default: '' },
    lensPrice: { type: Number, default: 0 },
    coating: { type: String, default: '' },
    powerType: { type: String, default: '' },
    powerTypeId: { type: String, default: '' },
    image: { type: String, default: '' },
  },
  lensDetails: { type: [lensDetailSchema], default: [] },
  billing: {
    discount: { type: Number, default: 0 },
    paymentMode: { type: String, enum: ['Online', 'Card', 'Cash'], default: 'Online' },
    subtotal: { type: Number, default: 0 },
    totalPayable: { type: Number, default: 0 },
    partialPaymentEnabled: { type: Boolean, default: false },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
  },
  meta: {
    source: { type: String, default: 'mobile-app' },
    store: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      code: { type: String, default: '' },
    },
    salesperson: {
      id: { type: String, default: '' },
      name: { type: String, default: '' },
      employeeId: { type: String, default: '' },
    },
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Placed', 'Processing', 'Ready', 'Delivered', 'Cancelled'],
    default: 'Pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('AppOrderPlacement', appOrderPlacementSchema);
