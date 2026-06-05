const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  items: [
    {
      lensCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'LensCategory' },
      lensType: { type: mongoose.Schema.Types.ObjectId, ref: 'LensType' },
      coating: { type: mongoose.Schema.Types.ObjectId, ref: 'Coating' },
      eyePower: {
        left: { sphere: Number, cylinder: Number, axis: Number, addition: Number },
        right: { sphere: Number, cylinder: Number, axis: Number, addition: Number },
        pupillaryDistance: Number,
      },
      quantity: { type: Number, default: 1 },
      price: { type: Number, required: true },
    }
  ],
  totalAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  deliveryDate: { type: Date },
  status: { type: String, enum: ['Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);