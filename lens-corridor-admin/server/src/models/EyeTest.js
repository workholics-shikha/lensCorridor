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

    // Customer Details
    name:         { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true },
    address:      { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EyeTest', eyeTestSchema);