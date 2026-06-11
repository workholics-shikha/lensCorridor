const Store = require('../models/Store');

const sanitizeStore = (store) => ({
  id: store._id,
  name: store.storeName,
  code: store.storeCode,
  address: {
    street: store.address?.street || '',
    city: store.address?.city || '',
    state: store.address?.state || '',
    pincode: store.address?.pincode || '',
  },
  phone: store.phone || '',
  email: store.email || '',
  managerName: store.managerName || '',
  status: store.status,
  createdAt: store.createdAt,
  updatedAt: store.updatedAt,
});

const listStores = async (req, res) => {
  try {
    const stores = await Store.find().sort({ storeName: 1 });
    res.json(stores.map(sanitizeStore));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
};

const createStore = async (req, res) => {
  try {
    const {
      storeName,
      storeCode,
      street,
      city,
      state,
      pincode,
      phone,
      email,
      managerName,
      status,
    } = req.body;

    if (!storeName || !storeCode) {
      return res.status(400).json({ error: 'Store name and store code are required' });
    }

    const store = await Store.create({
      storeName: storeName.trim(),
      storeCode: storeCode.trim().toUpperCase(),
      address: {
        street: street?.trim() || '',
        city: city?.trim() || '',
        state: state?.trim() || '',
        pincode: pincode?.trim() || '',
      },
      phone: phone?.trim() || '',
      email: email?.trim().toLowerCase() || '',
      managerName: managerName?.trim() || '',
      status: status || 'Active',
    });

    res.status(201).json(sanitizeStore(store));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Store code already exists' });
    }

    res.status(500).json({ error: 'Failed to create store' });
  }
};

const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      storeName,
      storeCode,
      street,
      city,
      state,
      pincode,
      phone,
      email,
      managerName,
      status,
    } = req.body;

    if (!storeName || !storeCode) {
      return res.status(400).json({ error: 'Store name and store code are required' });
    }

    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    store.storeName = storeName.trim();
    store.storeCode = storeCode.trim().toUpperCase();
    store.address = {
      street: street?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      pincode: pincode?.trim() || '',
    };
    store.phone = phone?.trim() || '';
    store.email = email?.trim().toLowerCase() || '';
    store.managerName = managerName?.trim() || '';
    store.status = status || 'Active';

    await store.save();

    res.json(sanitizeStore(store));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Store code already exists' });
    }

    res.status(500).json({ error: 'Failed to update store' });
  }
};

const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByIdAndDelete(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete store' });
  }
};

module.exports = { listStores, createStore, updateStore, deleteStore };
