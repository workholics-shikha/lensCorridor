const mongoose = require('mongoose');

const eyePowerSchema = new mongoose.Schema({
  eye: { type: String, enum: ['Left', 'Right', 'Both'], required: true },
  sphere: { type: Number },       // SPH
  cylinder: { type: Number },     // CYL
  axis: { type: Number },         // Axis (0-180)
  addition: { type: Number },     // ADD (for bifocal/progressive)
  pupillaryDistance: { type: Number }, // PD
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('EyePower', eyePowerSchema);