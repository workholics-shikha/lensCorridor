// server/src/models/PowerType.js
const mongoose = require('mongoose');

const powerTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },  // "With Power"
    tag: { type: String, trim: true },                  // "Most common", "BLU Screen lenses"
    description: { type: String, trim: true },                  // "Positive, Negative or Cylindrical"
    image: { type: String, trim: true },                  // image key or URL
    icon: { type: String },                              // image URL
    priority: { type: Number, default: 0 },                  // for ordering
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PowerType', powerTypeSchema);
