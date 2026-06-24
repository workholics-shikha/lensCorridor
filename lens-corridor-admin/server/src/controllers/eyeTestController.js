const EyeTest = require('../models/EyeTest');
const Customer = require('../models/Customer');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').slice(-10);
const normalizeName = (value = '') => String(value).trim().replace(/\s+/g, ' ').toLowerCase();

const syncCustomerFromEyeTest = async ({
  name,
  mobileNumber,
  email,
  address,
  spherical,
  cylindrical,
  axis,
}) => {
  const phone = normalizePhone(mobileNumber);

  if (!phone) {
    return null;
  }

  const trimmedName = String(name ?? '').trim();
  const trimmedEmail = String(email ?? '').trim().toLowerCase();
  const trimmedAddress = String(address ?? '').trim();
  const normalizedName = normalizeName(trimmedName);
  const nextEyePower = {
    left: {
      sphere: spherical?.left ?? null,
      cylinder: cylindrical?.left ?? null,
      axis: axis?.left ?? null,
    },
    right: {
      sphere: spherical?.right ?? null,
      cylinder: cylindrical?.right ?? null,
      axis: axis?.right ?? null,
    },
  };

  const existingCustomer = await Customer.findOne({
    phone,
    ...(normalizedName ? { name: { $regex: new RegExp(`^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } } : {}),
  });

  if (existingCustomer) {
    existingCustomer.name = trimmedName || existingCustomer.name;
    existingCustomer.phone = phone;
    existingCustomer.email = trimmedEmail || existingCustomer.email || '';
    existingCustomer.status = existingCustomer.status || 'Active';
    existingCustomer.address = {
      ...existingCustomer.address?.toObject?.(),
      ...(existingCustomer.address || {}),
      street: trimmedAddress || existingCustomer.address?.street || '',
    };
    existingCustomer.eyePower = {
      ...(existingCustomer.eyePower?.toObject?.() || existingCustomer.eyePower || {}),
      ...nextEyePower,
    };

    await existingCustomer.save();
    return existingCustomer;
  }

  const customerWithSamePhone = await Customer.findOne({ phone }).sort({ updatedAt: -1 });

  if (customerWithSamePhone && !normalizedName) {
    customerWithSamePhone.phone = phone;
    customerWithSamePhone.email = trimmedEmail || customerWithSamePhone.email || '';
    customerWithSamePhone.status = customerWithSamePhone.status || 'Active';
    customerWithSamePhone.address = {
      ...customerWithSamePhone.address?.toObject?.(),
      ...(customerWithSamePhone.address || {}),
      street: trimmedAddress || customerWithSamePhone.address?.street || '',
    };
    customerWithSamePhone.eyePower = {
      ...(customerWithSamePhone.eyePower?.toObject?.() || customerWithSamePhone.eyePower || {}),
      ...nextEyePower,
    };

    await customerWithSamePhone.save();
    return customerWithSamePhone;
  }

  return Customer.create({
    name: trimmedName || 'Customer',
    email: trimmedEmail,
    phone,
    address: {
      street: trimmedAddress,
    },
    eyePower: nextEyePower,
    status: 'Active',
  });
};

// POST /api/eye-tests
const createEyeTest = async (req, res) => {
  try {
    const {
      samePowerBothEyes,
      hasCylindricalPower,
      spherical,
      cylindrical,
      axis,
      name,
      mobileNumber,
      email,
      address,
    } = req.body;

    const normalizedMobileNumber = normalizePhone(mobileNumber);

    if (!name?.trim() || !normalizedMobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and valid mobile number are required',
      });
    }

    const finalSpherical = samePowerBothEyes
      ? { right: spherical?.right ?? null, left: spherical?.right ?? null }
      : {
        right: spherical?.right ?? null,
        left: spherical?.left ?? null,
      };

    const finalCylindrical = hasCylindricalPower
      ? (samePowerBothEyes
        ? { right: cylindrical?.right ?? null, left: cylindrical?.right ?? null }
        : {
          right: cylindrical?.right ?? null,
          left: cylindrical?.left ?? null,
        })
      : null;

    const finalAxis = hasCylindricalPower
      ? (samePowerBothEyes
        ? { right: axis?.right ?? null, left: axis?.right ?? null }
        : {
          right: axis?.right ?? null,
          left: axis?.left ?? null,
        })
      : null;

    const customer = await syncCustomerFromEyeTest({
      name,
      mobileNumber: normalizedMobileNumber,
      email,
      address,
      spherical: finalSpherical,
      cylindrical: finalCylindrical,
      axis: finalAxis,
    });

    const eyeTest = await EyeTest.create({
      samePowerBothEyes: Boolean(samePowerBothEyes),
      hasCylindricalPower: Boolean(hasCylindricalPower),
      spherical: finalSpherical,
      cylindrical: finalCylindrical,
      axis: finalAxis,
      name: String(name).trim(),
      mobileNumber: normalizedMobileNumber,
      email: String(email ?? '').trim().toLowerCase(),
      address: String(address ?? '').trim(),
      customer: customer?._id ?? null,
    });

    res.status(201).json({
      success: true,
      message: 'Eye test saved successfully',
      data: eyeTest,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/eye-tests
const getAllEyeTests = async (req, res) => {
  try {
    const normalizedMobileNumber = normalizePhone(req.query?.mobileNumber);
    const filter = normalizedMobileNumber
      ? { mobileNumber: { $regex: `${normalizedMobileNumber}$` } }
      : {};

    const eyeTests = await EyeTest.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: eyeTests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/eye-tests/:id
const getEyeTestById = async (req, res) => {
  try {
    const eyeTest = await EyeTest.findById(req.params.id);
    if (!eyeTest) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.json({ success: true, data: eyeTest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createEyeTest, getAllEyeTests, getEyeTestById };
