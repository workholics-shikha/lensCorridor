const mongoose = require('mongoose');

const lensCategorySchema = new mongoose.Schema({
    categoryName: { type: String, required: true },
    displayLabel: { type: String, required: true },
    linkedPricingBand: { type: String },
    description: { type: String },

    // optional mapping to one or more PowerTypes (used by Lens Category pricing / validation)
    powertype_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PowerType' }],

    priority: { type: Number, default: 0 },
    internalCode: { type: String },
    usageAndMapping: { type: String },
    status: { type: String, enum: ['Active', 'Review', 'Expiring', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('LensCategory', lensCategorySchema);
