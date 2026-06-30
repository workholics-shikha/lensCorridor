const Customer = require('../models/Customer');
const AppOrderPlacement = require('../models/AppOrderPlacement');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').slice(-10);

const buildCustomerSummary = (customer, orders) => {
  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order?.billing?.totalPayable ?? 0),
    0
  );
  const lastOrder = orders[0] || null;

  return {
    id: customer._id.toString(),
    name: customer.name || 'Customer',
    phone: customer.phone || '',
    email: customer.email || '',
    status: customer.status || 'Active',
    address: {
      street: customer.address?.street || '',
      city: customer.address?.city || '',
      state: customer.address?.state || '',
      pincode: customer.address?.pincode || '',
    },
    dateOfBirth: customer.dateOfBirth || null,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    orderCount: orders.length,
    totalSpent,
    lastOrderDate: lastOrder?.createdAt || null,
    lastOrderNumber: lastOrder?.orderNumber || '',
    lastPaymentMode: lastOrder?.billing?.paymentMode || '',
    lastLensType:
      lastOrder?.lensSelection?.lensCategory
      || lastOrder?.lensSelection?.lensType
      || lastOrder?.lensSelection?.powerType
      || '',
  };
};

const listCustomers = async (req, res) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const normalizedSearchPhone = normalizePhone(search);
    const customerFilter = {};

    if (search) {
      customerFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: normalizedSearchPhone || search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(customerFilter).sort({ updatedAt: -1, createdAt: -1 });

    const phoneSet = new Set(
      customers
        .map((customer) => normalizePhone(customer.phone))
        .filter(Boolean)
    );

    let relatedOrders = [];
    if (phoneSet.size > 0) {
      relatedOrders = await AppOrderPlacement.find({
        'customer.phone': { $in: [...phoneSet] },
      }).sort({ createdAt: -1 });
    }

    const ordersByPhone = relatedOrders.reduce((map, order) => {
      const phone = normalizePhone(order?.customer?.phone);
      if (!phone) {
        return map;
      }

      if (!map.has(phone)) {
        map.set(phone, []);
      }

      map.get(phone).push(order);
      return map;
    }, new Map());

    const items = customers.map((customer) => (
      buildCustomerSummary(customer, ordersByPhone.get(normalizePhone(customer.phone)) || [])
    ));

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch customers',
    });
  }
};

module.exports = { listCustomers, normalizePhone };
