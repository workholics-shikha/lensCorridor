const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    reason: { type: String, required: true },
    items: [
        {
            lensCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'LensCategory' },
            lensType: { type: mongoose.Schema.Types.ObjectId, ref: 'LensType' },
            quantity: { type: Number, default: 1 },
            refundAmount: { type: Number },
        }
    ],
    totalRefundAmount: { type: Number },
    status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Completed'], default: 'Requested' },
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);