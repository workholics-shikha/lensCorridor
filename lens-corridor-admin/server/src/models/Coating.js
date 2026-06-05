const mongoose = require('mongoose');

const coatingSchema = new mongoose.Schema({
  coatingName: { type: String, required: true },
  displayLabel: { type: String, required: true },
  compatibleLensTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LensType' }],
  description: { type: String },
  internalCode: { type: String },
  priority: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Review', 'Expiring', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Coating', coatingSchema);