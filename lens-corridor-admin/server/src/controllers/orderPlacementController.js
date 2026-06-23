const AppOrderPlacement = require('../models/AppOrderPlacement');
const Customer = require('../models/Customer');
const { normalizePhone } = require('./customerController');
const mongoose = require('mongoose');

const formatInvoiceDate = (date) => date.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatPaymentDate = (date) => new Date(date).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const formatPaymentTime = (date) => new Date(date).toLocaleTimeString('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const buildPaymentEntry = (input, fallbackDate) => {
  const collectedAt = input?.collectedAt || fallbackDate || new Date();

  return {
    amount: Number(input?.amount ?? 0),
    paymentMode: sanitizePaymentMode(input?.paymentMode),
    collectedAt,
    paymentDate: String(input?.paymentDate || formatPaymentDate(collectedAt)),
    paymentTime: String(input?.paymentTime || formatPaymentTime(collectedAt)),
  };
};

const toPlainBilling = (billing, fallbackDate) => {
  const plainBilling = billing?.toObject?.() || billing || {};
  const payments = Array.isArray(plainBilling.payments)
    ? plainBilling.payments
      .filter((payment) => Number(payment?.amount ?? 0) > 0)
      .map((payment) => buildPaymentEntry(payment, fallbackDate))
    : [];

  return {
    discount: Number(plainBilling.discount ?? 0),
    paymentMode: sanitizePaymentMode(plainBilling.paymentMode),
    subtotal: Number(plainBilling.subtotal ?? 0),
    totalPayable: Number(plainBilling.totalPayable ?? 0),
    partialPaymentEnabled: Boolean(plainBilling.partialPaymentEnabled),
    paidAmount: Number(plainBilling.paidAmount ?? 0),
    remainingAmount: Number(plainBilling.remainingAmount ?? 0),
    payments,
  };
};

const padNumber = (value, size) => String(value).padStart(size, '0');

const generateOrderNumber = async (invoiceDate) => {
  const year = invoiceDate.getFullYear();
  const month = padNumber(invoiceDate.getMonth() + 1, 2);
  const day = padNumber(invoiceDate.getDate(), 2);
  const prefix = `LC-${year}${month}${day}`;
  const dayStart = new Date(year, invoiceDate.getMonth(), invoiceDate.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(year, invoiceDate.getMonth(), invoiceDate.getDate(), 23, 59, 59, 999);
  const count = await AppOrderPlacement.countDocuments({
    createdAt: { $gte: dayStart, $lte: dayEnd },
  });

  return `${prefix}-${padNumber(count + 1, 4)}`;
};

const mapOrderPlacement = (document) => ({
  id: document._id.toString(),
  orderNumber: document.orderNumber,
  invoiceDate: formatInvoiceDate(document.invoiceDate),
  storeId: document.store_id ? document.store_id.toString() : '',
  customer: document.customer,
  frame: document.frame,
  lensSelection: document.lensSelection,
  lensDetails: document.lensDetails,
  billing: toPlainBilling(document.billing, document.invoiceDate || document.createdAt),
  meta: document.meta,
  status: document.status,
  createdAt: document.createdAt,
  updatedAt: document.updatedAt,
});

const resolveStoreId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return undefined;
  }

  return new mongoose.Types.ObjectId(value);
};

const syncCustomerFromOrder = async (payload) => {
  const phone = normalizePhone(payload.customer?.phone);

  if (!phone) {
    return null;
  }

  const name = String(payload.customer?.name ?? '').trim();
  const billingAddress = String(payload.customer?.billingAddress ?? '').trim();
  const storeId = resolveStoreId(payload.meta?.store?.id);

  const existingCustomer = await Customer.findOne({ phone });

  if (existingCustomer) {
    existingCustomer.name = name || existingCustomer.name;
    existingCustomer.phone = phone;
    existingCustomer.status = existingCustomer.status || 'Active';
    existingCustomer.address = {
      ...existingCustomer.address?.toObject?.(),
      ...(existingCustomer.address || {}),
      street: billingAddress || existingCustomer.address?.street || '',
    };
    if (storeId) {
      existingCustomer.store = storeId;
    }

    await existingCustomer.save();
    return existingCustomer;
  }

  return Customer.create({
    name: name || 'Customer',
    phone,
    address: {
      street: billingAddress,
    },
    store: storeId,
    status: 'Active',
  });
};

const sanitizePaymentMode = (value) => {
  const normalizedValue = String(value ?? '').trim();
  return ['Online', 'Card', 'Cash'].includes(normalizedValue) ? normalizedValue : 'Online';
};

const normalizeBillingPayments = (document) => {
  if (!document?.billing) {
    return false;
  }

  const billing = document.billing;
  const totalPayable = Number(billing.totalPayable ?? 0);
  const paidAmount = Number(billing.paidAmount ?? 0);
  const normalizedPaymentMode = sanitizePaymentMode(billing.paymentMode);
  const existingPayments = Array.isArray(billing.payments)
    ? billing.payments.filter((payment) => Number(payment?.amount ?? 0) > 0)
    : [];
  const recordedAmount = existingPayments.reduce((sum, payment) => (
    sum + Number(payment?.amount ?? 0)
  ), 0);
  const missingAmount = Math.max(0, Math.min(paidAmount, totalPayable || paidAmount) - recordedAmount);

  billing.payments = existingPayments;

  if (missingAmount <= 0) {
    return false;
  }

  billing.payments.push({
    ...buildPaymentEntry({
      amount: missingAmount,
      paymentMode: normalizedPaymentMode,
      collectedAt: document.invoiceDate || document.createdAt || new Date(),
    }, document.invoiceDate || document.createdAt),
  });

  return true;
};

const createOrderPlacement = async (req, res) => {
  try {
    const payload = req.body || {};
    const invoiceDate = new Date();
    const orderNumber = payload.orderNumber?.trim() || await generateOrderNumber(invoiceDate);
    const normalizedPhone = normalizePhone(payload.customer?.phone);
    const storeId = resolveStoreId(payload.meta?.store?.id);
    const totalPayable = Number(payload.billing?.totalPayable ?? 0);
    const paidAmount = Number(payload.billing?.paidAmount ?? totalPayable);
    const paymentMode = sanitizePaymentMode(payload.billing?.paymentMode);
    const remainingAmount = Number(payload.billing?.remainingAmount ?? Math.max(0, totalPayable - paidAmount));
    const normalizedPaidAmount = Math.min(Math.max(paidAmount, 0), Math.max(totalPayable, 0));
    const normalizedRemainingAmount = Math.max(0, totalPayable - normalizedPaidAmount);
    const payments = normalizedPaidAmount > 0
      ? [buildPaymentEntry({
          amount: normalizedPaidAmount,
          paymentMode,
          collectedAt: invoiceDate,
        }, invoiceDate)]
      : [];

    const document = await AppOrderPlacement.create({
      orderNumber,
      invoiceDate,
      store_id: storeId,
      customer: {
        name: payload.customer?.name ?? '',
        phone: normalizedPhone,
        billingAddress: payload.customer?.billingAddress ?? '',
      },
      frame: {
        selectedShape: payload.frame?.selectedShape ?? '',
        price: Number(payload.frame?.price ?? 0),
        images: Array.isArray(payload.frame?.images) ? payload.frame.images : [],
      },
      lensSelection: {
        lensType: payload.lensSelection?.lensType ?? '',
        lensCategory: payload.lensSelection?.lensCategory ?? '',
        lensCategoryId: payload.lensSelection?.lensCategoryId ?? '',
        lensPrice: Number(payload.lensSelection?.lensPrice ?? 0),
        coating: payload.lensSelection?.coating ?? '',
        powerType: payload.lensSelection?.powerType ?? '',
        powerTypeId: payload.lensSelection?.powerTypeId ?? '',
        image: payload.lensSelection?.image ?? '',
      },
      lensDetails: Array.isArray(payload.lensDetails) ? payload.lensDetails : [],
      billing: {
        discount: Number(payload.billing?.discount ?? 0),
        paymentMode,
        subtotal: Number(payload.billing?.subtotal ?? 0),
        totalPayable,
        partialPaymentEnabled: normalizedRemainingAmount > 0,
        paidAmount: normalizedPaidAmount,
        remainingAmount: normalizedRemainingAmount,
        payments,
      },
      meta: {
        source: payload.meta?.source ?? 'mobile-app',
        store: {
          id: payload.meta?.store?.id ?? '',
          name: payload.meta?.store?.name ?? '',
          code: payload.meta?.store?.code ?? '',
        },
        salesperson: {
          id: payload.meta?.salesperson?.id ?? '',
          name: payload.meta?.salesperson?.name ?? '',
          employeeId: payload.meta?.salesperson?.employeeId ?? '',
        },
      },
      status: 'Pending',
    });

    await syncCustomerFromOrder({
      ...payload,
      customer: {
        ...payload.customer,
        phone: normalizedPhone,
      },
    });

    res.status(201).json({
      success: true,
      data: mapOrderPlacement(document),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to place order',
    });
  }
};

const updateOrderPlacementStatus = async (req, res) => {
  try {
    const nextStatus = String(req.body?.status ?? '').trim();

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      });
    }

    const document = await AppOrderPlacement.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Order placement not found',
      });
    }

    document.status = nextStatus;
    await document.save();

    res.json({
      success: true,
      data: mapOrderPlacement(document),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order status',
    });
  }
};

const updateOrderPlacementBilling = async (req, res) => {
  try {
    const document = await AppOrderPlacement.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Order placement not found',
      });
    }

    normalizeBillingPayments(document);
    const totalPayable = Number(document.billing?.totalPayable ?? 0);
    const currentPaidAmount = Number(document.billing?.paidAmount ?? 0);
    const additionalCollectedAmount = Number(req.body?.additionalCollectedAmount ?? 0);
    const nextPaymentMode = String(req.body?.paymentMode ?? '').trim();

    if (!Number.isFinite(additionalCollectedAmount) || additionalCollectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional collected amount must be greater than zero',
      });
    }

    if (nextPaymentMode && !['Online', 'Card', 'Cash'].includes(nextPaymentMode)) {
      return res.status(400).json({
        success: false,
        message: 'Payment mode is invalid',
      });
    }

    const nextPaidAmount = Math.min(totalPayable, currentPaidAmount + additionalCollectedAmount);
    const nextRemainingAmount = Math.max(0, totalPayable - nextPaidAmount);
    const appliedPaymentMode = sanitizePaymentMode(nextPaymentMode || document.billing?.paymentMode);
    const appliedCollectedAmount = Math.min(additionalCollectedAmount, Math.max(0, totalPayable - currentPaidAmount));
    const existingPayments = Array.isArray(document.billing?.payments)
      ? document.billing.payments
        .filter((payment) => Number(payment?.amount ?? 0) > 0)
        .map((payment) => buildPaymentEntry(payment, document.invoiceDate || document.createdAt))
      : [];
    const nextPayments = [
      ...existingPayments,
      buildPaymentEntry({
        amount: appliedCollectedAmount,
        paymentMode: appliedPaymentMode,
        collectedAt: new Date(),
      }, document.invoiceDate || document.createdAt),
    ];
    const nextStatus = nextRemainingAmount === 0
      ? 'Completed'
      : document.status;
    const nextBilling = {
      ...toPlainBilling(document.billing, document.invoiceDate || document.createdAt),
      paymentMode: appliedPaymentMode,
      paidAmount: nextPaidAmount,
      remainingAmount: nextRemainingAmount,
      partialPaymentEnabled: nextRemainingAmount > 0,
      payments: nextPayments,
    };

    document.billing = nextBilling;
    document.status = nextStatus;
    document.markModified('billing');
    await document.save();

    res.json({
      success: true,
      data: mapOrderPlacement(document),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update order billing',
    });
  }
};

const listOrderPlacements = async (req, res) => {
  try {
    const searchQuery = String(req.query.search ?? '').trim();
    const phoneQuery = String(req.query.phone ?? '').replace(/\D/g, '').slice(-10);
    const orderNumberQuery = String(req.query.orderNumber ?? '').trim();
    const storeIdQuery = String(req.query.storeId ?? '').trim();
    const limit = Number(req.query.limit ?? 0);
    const filter = {};
    const normalizedSearchPhone = searchQuery.replace(/\D/g, '').slice(-10);

    if (searchQuery) {
      const searchConditions = [
        { 'customer.name': { $regex: searchQuery, $options: 'i' } },
        { orderNumber: { $regex: searchQuery, $options: 'i' } },
      ];

      if (normalizedSearchPhone) {
        searchConditions.push({ 'customer.phone': { $regex: normalizedSearchPhone } });
      }

      filter.$or = searchConditions;
    }

    if (phoneQuery) {
      filter['customer.phone'] = { $regex: phoneQuery };
    }

    if (orderNumberQuery) {
      filter.orderNumber = { $regex: orderNumberQuery, $options: 'i' };
    }

    if (storeIdQuery) {
      const resolvedStoreId = resolveStoreId(storeIdQuery);
      if (resolvedStoreId) {
        filter.store_id = resolvedStoreId;
      } else {
        filter['meta.store.id'] = storeIdQuery;
      }
    }

    let query = AppOrderPlacement.find(filter)
      .sort({ createdAt: -1 });

    if (Number.isFinite(limit) && limit > 0) {
      query = query.limit(limit);
    }

    const items = await query;

    res.json({
      success: true,
      count: items.length,
      data: items.map(mapOrderPlacement),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order placements',
    });
  }
};

const getOrderPlacementById = async (req, res) => {
  try {
    const document = await AppOrderPlacement.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Order placement not found',
      });
    }

    if (normalizeBillingPayments(document)) {
      await document.save();
    }

    res.json({
      success: true,
      data: mapOrderPlacement(document),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch order placement',
    });
  }
};

module.exports = {
  createOrderPlacement,
  listOrderPlacements,
  getOrderPlacementById,
  updateOrderPlacementStatus,
  updateOrderPlacementBilling,
};
