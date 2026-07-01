const mongoose = require('mongoose');

const AppOrderPlacement = require('../models/AppOrderPlacement');
const Customer = require('../models/Customer');
const RepairRequest = require('../models/Repair');
const { normalizePhone } = require('./customerController');
const { getAssignedStoreId, isManagerUser } = require('../utils/accessScope');

const padNumber = (value, size) => String(value).padStart(size, '0');

const buildReferenceNumber = async () => {
  const now = new Date();
  const dayCode = `${now.getFullYear()}${padNumber(now.getMonth() + 1, 2)}${padNumber(now.getDate(), 2)}`;
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const count = await RepairRequest.countDocuments({
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });

  return `REP-${dayCode}-${padNumber(count + 1, 4)}`;
};

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const buildScopedStoreFilter = (user) => {
  if (!isManagerUser(user)) {
    return {};
  }

  const assignedStoreId = getAssignedStoreId(user);
  const storeObjectId = toObjectId(assignedStoreId);
  return {
    store: storeObjectId || null,
  };
};

const clonePlain = (value) => {
  if (!value) {
    return null;
  }

  return JSON.parse(JSON.stringify(value));
};

const formatInvoiceDate = (value) => {
  if (!value) {
    return '';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const mapOrderPlacement = (document) => ({
  id: document?._id ? document._id.toString() : '',
  orderNumber: document?.orderNumber || '',
  invoiceDate: formatInvoiceDate(document?.invoiceDate),
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

const mapRepairDetail = (document) => {
  const orderDocument = document.order && document.order._id ? document.order : null;
  const orderSnapshot = document.orderSnapshot || null;
  const orderSource = orderDocument || orderSnapshot || {};
  const storeSource = orderSource?.meta?.store || {};
  const salespersonSource = document.salesperson || orderSource?.meta?.salesperson || {};

  return {
    id: document._id.toString(),
    referenceNumber: document.referenceNumber || '',
    originalOrderId: orderDocument?._id
      ? orderDocument._id.toString()
      : (orderSnapshot?.id || document.order?.toString?.() || ''),
    originalOrderNumber: orderSource?.orderNumber || '',
    customerName: document.customerName || orderSource?.customer?.name || 'Customer',
    customerPhone: document.customerPhone || orderSource?.customer?.phone || '',
    createdAt: document.createdAt,
    repairScope: document.repairScope || 'full-product',
    issueType: document.issueType || '',
    remarks: document.remarks || '',
    estimatedAmount: Number(document.estimatedAmount ?? 0),
    advanceAmount: Number(document.advanceAmount ?? 0),
    remainingAmount: Number(document.remainingAmount ?? 0),
    expectedDeliveryDate: document.expectedDeliveryDate,
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
    status: document.status || 'Requested',
  };
};

const mapRepairSummary = (document) => {
  const detail = mapRepairDetail(document);
  const originalOrderSnapshot = detail.originalOrderSnapshot || {};

  return {
    id: detail.id,
    referenceNumber: detail.referenceNumber,
    orderId: detail.originalOrderId,
    orderNumber: detail.originalOrderNumber || '-',
    customerId: document.customer?._id ? document.customer._id.toString() : '',
    customerName: detail.customerName,
    customerPhone: detail.customerPhone,
    storeId: detail.store?.id || '',
    storeName: detail.store?.name || 'Store not assigned',
    repairScope: detail.repairScope,
    issueType: detail.issueType,
    remarks: detail.remarks,
    estimatedAmount: detail.estimatedAmount,
    advanceAmount: detail.advanceAmount,
    remainingAmount: detail.remainingAmount,
    expectedDeliveryDate: detail.expectedDeliveryDate,
    status: detail.status,
    orderDate: originalOrderSnapshot.invoiceDate || '',
    orderCreatedAt: originalOrderSnapshot.createdAt || null,
    createdAt: detail.createdAt,
    updatedAt: document.updatedAt,
  };
};

const createRepair = async (req, res) => {
  try {
    const payload = req.body || {};
    const orderId = String(payload.orderId || '').trim();
    const issueType = String(payload.issueType || '').trim();
    const estimatedAmount = Number(payload.estimatedAmount ?? 0);
    const advanceAmount = Number(payload.advanceAmount ?? 0);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required',
      });
    }

    if (!issueType) {
      return res.status(400).json({
        success: false,
        message: 'Repair issue is required',
      });
    }

    if (!Number.isFinite(estimatedAmount) || estimatedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Estimated amount is invalid',
      });
    }

    if (!Number.isFinite(advanceAmount) || advanceAmount < 0 || advanceAmount > estimatedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Advance amount is invalid',
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

    const expectedDeliveryDate = payload.expectedDeliveryDate
      ? new Date(payload.expectedDeliveryDate)
      : null;

    const document = await RepairRequest.create({
      referenceNumber: await buildReferenceNumber(),
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
      repairScope: payload.repairScope || 'full-product',
      issueType,
      remarks: String(payload.remarks || '').trim(),
      estimatedAmount,
      advanceAmount,
      remainingAmount: Math.max(0, estimatedAmount - advanceAmount),
      expectedDeliveryDate: expectedDeliveryDate && !Number.isNaN(expectedDeliveryDate.getTime())
        ? expectedDeliveryDate
        : null,
      orderSnapshot: clonePlain(payload.originalOrderSnapshot) || mapOrderPlacement(order),
      status: 'Requested',
    });

    const populatedDocument = await RepairRequest.findById(document._id)
      .populate('order')
      .populate('customer')
      .populate('store');

    res.status(201).json({
      success: true,
      data: mapRepairDetail(populatedDocument),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create repair request',
    });
  }
};

const listRepairs = async (req, res) => {
  try {
    const documents = await RepairRequest.find(buildScopedStoreFilter(req.user))
      .populate('order')
      .populate('customer')
      .populate('store')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: documents.map(mapRepairSummary),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch repairs',
    });
  }
};

module.exports = {
  createRepair,
  listRepairs,
};
