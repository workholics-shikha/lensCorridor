const ReturnRequest = require('../models/Return');

const mapReturnRequest = (document) => {
  const order = document.order || {};
  const customerDocument = document.customer || {};
  const storeDocument = document.store || {};
  const items = Array.isArray(document.items) ? document.items : [];
  const fallbackCustomerName = order?.customer?.name || customerDocument?.name || 'Customer';
  const fallbackStoreName = order?.meta?.store?.name || storeDocument?.storeName || 'Store not assigned';

  return {
    id: document._id.toString(),
    orderId: document.order?._id ? document.order._id.toString() : '',
    orderNumber: order?.orderNumber || '-',
    customerId: document.customer?._id ? document.customer._id.toString() : '',
    customerName: fallbackCustomerName,
    customerPhone: order?.customer?.phone || customerDocument?.phone || '',
    storeId: document.store?._id ? document.store._id.toString() : '',
    storeName: fallbackStoreName,
    reason: document.reason || '-',
    status: document.status || 'Requested',
    totalRefundAmount: Number(document.totalRefundAmount ?? 0),
    itemCount: items.length,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
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
      data: documents.map(mapReturnRequest),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch returns',
    });
  }
};

module.exports = {
  listReturns,
};
