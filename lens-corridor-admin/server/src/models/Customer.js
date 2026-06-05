const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
  },
  dateOfBirth: { type: Date },
  eyePower: {
    left: {
      sphere: Number,
      cylinder: Number,
      axis: Number,
      addition: Number,
    },
    right: {
      sphere: Number,
      cylinder: Number,
      axis: Number,
      addition: Number,
    },
    pupillaryDistance: Number,
  },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);