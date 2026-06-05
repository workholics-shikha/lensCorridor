const mongoose = require('mongoose');

const frameShapeSchema = new mongoose.Schema(
    {
        shape: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        subtitle: { type: String, default: '' },
        meta: { type: String, default: '' },
        code: { type: String, default: '' },
        status: { type: String, enum: ['Active', 'Review', 'Inactive'], default: 'Active' },
        priority: { type: Number, default: 1 },
        description: { type: String, default: '' },
        image: { type: String, default: '' },
        imageAlt: { type: String, default: '' },
        detailValues: { type: [mongoose.Schema.Types.Mixed], default: [] },

    },
    { timestamps: true },
);

module.exports = mongoose.model('FrameShape', frameShapeSchema);

