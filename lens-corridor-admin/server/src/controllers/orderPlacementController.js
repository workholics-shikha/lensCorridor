const AppOrderPlacement = require('../models/AppOrderPlacement');
const Customer = require('../models/Customer');
const { normalizePhone } = require('./customerController');
const mongoose = require('mongoose');

const formatInvoiceDate = (date) => date.toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

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
  billing: document.billing,
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

const createOrderPlacement = async (req, res) => {
  try {
    const payload = req.body || {};
    const invoiceDate = new Date();
    const orderNumber = payload.orderNumber?.trim() || await generateOrderNumber(invoiceDate);
    const normalizedPhone = normalizePhone(payload.customer?.phone);
    const storeId = resolveStoreId(payload.meta?.store?.id);

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
        paymentMode: payload.billing?.paymentMode ?? 'Online',
        subtotal: Number(payload.billing?.subtotal ?? 0),
        totalPayable: Number(payload.billing?.totalPayable ?? 0),
        partialPaymentEnabled: Boolean(payload.billing?.partialPaymentEnabled),
        paidAmount: Number(payload.billing?.paidAmount ?? payload.billing?.totalPayable ?? 0),
        remainingAmount: Number(payload.billing?.remainingAmount ?? 0),
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

    const totalPayable = Number(document.billing?.totalPayable ?? 0);
    const currentPaidAmount = Number(document.billing?.paidAmount ?? 0);
    const additionalCollectedAmount = Number(req.body?.additionalCollectedAmount ?? 0);

    if (!Number.isFinite(additionalCollectedAmount) || additionalCollectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Additional collected amount must be greater than zero',
      });
    }

    const nextPaidAmount = Math.min(totalPayable, currentPaidAmount + additionalCollectedAmount);
    const nextRemainingAmount = Math.max(0, totalPayable - nextPaidAmount);

    document.billing.paidAmount = nextPaidAmount;
    document.billing.remainingAmount = nextRemainingAmount;
    document.billing.partialPaymentEnabled = nextRemainingAmount > 0;

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
    const phoneQuery = String(req.query.phone ?? '').replace(/\D/g, '').slice(-10);
    const orderNumberQuery = String(req.query.orderNumber ?? '').trim();
    const storeIdQuery = String(req.query.storeId ?? '').trim();
    const limit = Number(req.query.limit ?? 0);
    const filter = {};

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
