const mongoose = require('mongoose');

const AppOrderPlacement = require('../models/AppOrderPlacement');
const Customer = require('../models/Customer');
const ReturnRequest = require('../models/Return');
const { normalizePhone } = require('./customerController');

const padNumber = (value, size) => String(value).padStart(size, '0');

const buildReferenceNumber = async (type) => {
  const now = new Date();
  const prefix = type === 'exchange' ? 'EXC' : 'RET';
  const dayCode = `${now.getFullYear()}${padNumber(now.getMonth() + 1, 2)}${padNumber(now.getDate(), 2)}`;
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const count = await ReturnRequest.countDocuments({
    type,
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });

  return `${prefix}-${dayCode}-${padNumber(count + 1, 4)}`;
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const clonePlain = (value) => {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
};

const mapOrderPlacement = (document) => ({
  id: document?._id ? document._id.toString() : '',
  orderNumber: document?.orderNumber || '',
  invoiceDate: document?.invoiceDate
    ? new Date(document.invoiceDate).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    : '',
  customer: {
    name: document?.customer?.name || '',
    phone: document?.customer?.phone || '',
    billingAddress: document?.customer?.billingAddress || '',
  },
  frame: {
    selectedShape: document?.frame?.selectedShape || '',
    price: Number(document?.frame?.price ?? 0),
    images: Array.isArray(document?.frame?.images) ? document.frame.images : [],
  },
  lensSelection: {
    lensType: document?.lensSelection?.lensType || '',
    lensCategory: document?.lensSelection?.lensCategory || '',
    lensCategoryId: document?.lensSelection?.lensCategoryId || '',
    lensPrice: Number(document?.lensSelection?.lensPrice ?? 0),
    coating: document?.lensSelection?.coating || '',
    powerType: document?.lensSelection?.powerType || '',
    powerTypeId: document?.lensSelection?.powerTypeId || '',
    image: document?.lensSelection?.image || '',
  },
  lensDetails: Array.isArray(document?.lensDetails) ? document.lensDetails : [],
  billing: {
    discount: Number(document?.billing?.discount ?? 0),
    paymentMode: document?.billing?.paymentMode || 'Online',
    subtotal: Number(document?.billing?.subtotal ?? 0),
    totalPayable: Number(document?.billing?.totalPayable ?? 0),
    partialPaymentEnabled: Boolean(document?.billing?.partialPaymentEnabled),
    paidAmount: Number(document?.billing?.paidAmount ?? 0),
    remainingAmount: Number(document?.billing?.remainingAmount ?? 0),
  },
  meta: {
    source: document?.meta?.source || 'mobile-app',
    store: {
      id: document?.meta?.store?.id || '',
      name: document?.meta?.store?.name || '',
      code: document?.meta?.store?.code || '',
    },
    salesperson: {
      id: document?.meta?.salesperson?.id || '',
      name: document?.meta?.salesperson?.name || '',
      employeeId: document?.meta?.salesperson?.employeeId || '',
    },
  },
  status: document?.status || 'Pending',
  createdAt: document?.createdAt || null,
  updatedAt: document?.updatedAt || null,
});

const mapReturnRequestDetail = (document) => {
  const orderDocument = document.order && document.order._id ? document.order : null;
  const orderSnapshot = document.orderSnapshot || null;
  const orderSource = orderDocument || orderSnapshot || {};
  const storeSource = orderSource?.meta?.store || {};
  const salespersonSource = document.salesperson || orderSource?.meta?.salesperson || {};

  return {
    id: document._id.toString(),
    referenceNumber: document.referenceNumber || '',
    type: document.type || 'return',
    originalOrderId: orderDocument?._id
      ? orderDocument._id.toString()
      : (orderSnapshot?.id || document.order?.toString?.() || ''),
    originalOrderNumber: orderSource?.orderNumber || '',
    customerName: document.customerName || orderSource?.customer?.name || 'Customer',
    customerPhone: document.customerPhone || orderSource?.customer?.phone || '',
    createdAt: document.createdAt,
    itemScope: document.itemScope || 'full-product',
    reason: document.reason || '',
    remarks: document.remarks || '',
    refundType: document.refundType || undefined,
    originalAmount: Number(document.originalAmount ?? 0),
    revisedAmount: Number(document.revisedAmount ?? 0),
    settlementAmount: Number(document.settlementAmount ?? document.totalRefundAmount ?? 0),
    settlementType: document.settlementType || 'refund',
    store: {
      id: document.store?._id ? document.store._id.toString() : (storeSource?.id || ''),
      name: document.store?.storeName || storeSource?.name || '',
      code: document.store?.code || storeSource?.code || '',
    },
    salesperson: {
      id: salespersonSource?.id || '',
      name: salespersonSource?.name || '',
      employeeId: salespersonSource?.employeeId || '',
    },
    originalOrderSnapshot: orderDocument ? mapOrderPlacement(orderDocument) : clonePlain(orderSnapshot),
    replacementDraftSnapshot: clonePlain(document.replacementDraftSnapshot),
    status: document.status || 'Requested',
  };
};

const mapReturnRequestSummary = (document) => {
  const detail = mapReturnRequestDetail(document);

  return {
    id: detail.id,
    referenceNumber: detail.referenceNumber,
    type: detail.type,
    orderId: detail.originalOrderId,
    orderNumber: detail.originalOrderNumber || '-',
    customerId: document.customer?._id ? document.customer._id.toString() : '',
    customerName: detail.customerName,
    customerPhone: detail.customerPhone,
    storeId: detail.store?.id || '',
    storeName: detail.store?.name || 'Store not assigned',
    itemScope: detail.itemScope,
    reason: detail.reason || '-',
    remarks: detail.remarks || '',
    status: detail.status,
    refundType: detail.refundType || '',
    settlementAmount: detail.settlementAmount,
    settlementType: detail.settlementType,
    totalRefundAmount: detail.settlementType === 'refund' ? detail.settlementAmount : 0,
    itemCount: 1,
    createdAt: detail.createdAt,
    updatedAt: document.updatedAt,
  };
};

const ensureCustomer = async ({ order, customerName, customerPhone, storeId }) => {
  const normalizedCustomerPhone = normalizePhone(customerPhone || order?.customer?.phone);

  if (!normalizedCustomerPhone) {
    return null;
  }

  const existingCustomer = await Customer.findOne({ phone: normalizedCustomerPhone });
  if (existingCustomer) {
    return existingCustomer;
  }

  return Customer.create({
    name: customerName || order?.customer?.name || 'Customer',
    phone: normalizedCustomerPhone,
    address: {
      street: order?.customer?.billingAddress || '',
    },
    store: storeId || undefined,
    status: 'Active',
  });
};

const createReturn = async (req, res) => {
  try {
    const payload = req.body || {};
    const orderId = String(payload.orderId || '').trim();
    const type = payload.type === 'exchange' ? 'exchange' : 'return';
    const reason = String(payload.reason || '').trim();

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required',
      });
    }

    const order = await AppOrderPlacement.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order placement not found',
      });
    }

    const storeId = order.store_id || toObjectId(payload.store?.id);
    const customer = await ensureCustomer({
      order,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      storeId,
    });

    const document = await ReturnRequest.create({
      type,
      referenceNumber: await buildReferenceNumber(type),
      order: order._id,
      customer: customer?._id || undefined,
      store: storeId || undefined,
      salesperson: {
        id: payload.salesperson?.id || order.meta?.salesperson?.id || '',
        name: payload.salesperson?.name || order.meta?.salesperson?.name || '',
        employeeId: payload.salesperson?.employeeId || order.meta?.salesperson?.employeeId || '',
      },
      customerName: payload.customerName || order.customer?.name || customer?.name || 'Customer',
      customerPhone: normalizePhone(payload.customerPhone || order.customer?.phone || customer?.phone || ''),
      itemScope: payload.itemScope || 'full-product',
      reason,
      remarks: String(payload.remarks || '').trim(),
      refundType: type === 'return' ? (payload.refundType || '') : '',
      originalAmount: Number(payload.originalAmount ?? 0),
      revisedAmount: Number(payload.revisedAmount ?? 0),
      settlementAmount: Number(payload.settlementAmount ?? 0),
      settlementType: payload.settlementType || 'refund',
      totalRefundAmount: payload.settlementType === 'refund'
        ? Number(payload.settlementAmount ?? payload.originalAmount ?? 0)
        : 0,
      orderSnapshot: clonePlain(payload.originalOrderSnapshot) || mapOrderPlacement(order),
      replacementDraftSnapshot: clonePlain(payload.replacementDraft) || null,
      status: 'Requested',
    });

    const populatedDocument = await ReturnRequest.findById(document._id)
      .populate('order')
      .populate('customer')
      .populate('store');

    res.status(201).json({
      success: true,
      data: mapReturnRequestDetail(populatedDocument),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create return request',
    });
  }
};

const listReturns = async (req, res) => {
  try {
    const documents = await ReturnRequest.find({})
      .populate('order')
      .populate('customer')
      .populate('store')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents.map(mapReturnRequestSummary),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch returns',
    });
  }
};

module.exports = {
  createReturn,
  listReturns,
};
