const mongoose = require('mongoose');

const eyeTestSchema = new mongoose.Schema(
  {
    // Prescription
    samePowerBothEyes: {
      type: Boolean,
      default: false,
    },
    hasCylindricalPower: {
      type: Boolean,
      default: false,
    },
    spherical: {
      right: { type: Number, default: null },
      left:  { type: Number, default: null },
    },
    cylindrical: {
      right: { type: Number, default: null },
      left:  { type: Number, default: null },
    },
    axis: {
      right: { type: Number, default: null },
      left:  { type: Number, default: null },
    },
    addition: {
      right: { type: Number, default: null },
      left:  { type: Number, default: null },
    },
    pupillaryDistance: {
      type: Number,
      default: null,
    },

    // Customer Details
    name:         { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email:        { type: String, default: '', trim: true },
    address:      { type: String, default: '', trim: true },
    customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EyeTest', eyeTestSchema);
