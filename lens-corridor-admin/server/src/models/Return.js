const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['return', 'exchange'],
        default: 'return',
        index: true,
    },
    referenceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'AppOrderPlacement', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    salesperson: {
        id: { type: String, default: '' },
        name: { type: String, default: '' },
        employeeId: { type: String, default: '' },
    },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, default: '' },
    itemScope: {
        type: String,
        enum: ['frame', 'lens', 'full-product'],
        default: 'full-product',
    },
    reason: { type: String, required: true },
    remarks: { type: String, default: '' },
    refundType: {
        type: String,
        enum: ['original-payment', 'store-credit', 'cash', ''],
        default: '',
    },
    originalAmount: { type: Number, default: 0 },
    revisedAmount: { type: Number, default: 0 },
    settlementAmount: { type: Number, default: 0 },
    settlementType: {
        type: String,
        enum: ['refund', 'collect', 'even'],
        default: 'refund',
    },
    totalRefundAmount: { type: Number, default: 0 },
    orderSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    replacementDraftSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    status: { type: String, enum: ['Requested', 'Approved', 'Rejected', 'Completed'], default: 'Requested' },
}, { timestamps: true });

module.exports = mongoose.model('Return', returnSchema);
