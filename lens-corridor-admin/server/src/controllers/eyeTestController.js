const EyeTest = require('../models/EyeTest');
const Customer = require('../models/Customer');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').slice(-10);
const normalizeName = (value = '') => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const syncCustomerFromEyeTest = async ({
  name,
  mobileNumber,
  email,
  address,
  spherical,
  cylindrical,
  axis,
  addition,
  pupillaryDistance,
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
      addition: addition?.left ?? null,
    },
    right: {
      sphere: spherical?.right ?? null,
      cylinder: cylindrical?.right ?? null,
      axis: axis?.right ?? null,
      addition: addition?.right ?? null,
    },
    pupillaryDistance: pupillaryDistance ?? null,
  };

  const existingCustomer = await Customer.findOne({
    phone,
    ...(normalizedName ? { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } } : {}),
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
      addition,
      pupillaryDistance,
      name,
      mobileNumber,
      email,
      address,
    } = req.body;

    const normalizedMobileNumber = normalizePhone(mobileNumber);
    const trimmedName = String(name ?? '').trim();
    const normalizedName = normalizeName(trimmedName);

    if (!trimmedName || !normalizedMobileNumber) {
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

    const finalAddition = samePowerBothEyes
      ? { right: addition?.right ?? null, left: addition?.right ?? null }
      : {
        right: addition?.right ?? null,
        left: addition?.left ?? null,
      };

    const finalPupillaryDistance = pupillaryDistance ?? null;

    const customer = await syncCustomerFromEyeTest({
      name: trimmedName,
      mobileNumber: normalizedMobileNumber,
      email,
      address,
      spherical: finalSpherical,
      cylindrical: finalCylindrical,
      axis: finalAxis,
      addition: finalAddition,
      pupillaryDistance: finalPupillaryDistance,
    });

    const eyeTestPayload = {
      samePowerBothEyes: Boolean(samePowerBothEyes),
      hasCylindricalPower: Boolean(hasCylindricalPower),
      spherical: finalSpherical,
      cylindrical: finalCylindrical,
      axis: finalAxis,
      addition: finalAddition,
      pupillaryDistance: finalPupillaryDistance,
      name: trimmedName,
      mobileNumber: normalizedMobileNumber,
      email: String(email ?? '').trim().toLowerCase(),
      address: String(address ?? '').trim(),
      customer: customer?._id ?? null,
    };

    const existingEyeTest = await EyeTest.findOne({
      mobileNumber: normalizedMobileNumber,
      ...(normalizedName ? { name: { $regex: new RegExp(`^${escapeRegex(trimmedName)}$`, 'i') } } : {}),
    }).sort({ updatedAt: -1, createdAt: -1 });

    let eyeTest;
    let statusCode = 201;

    if (existingEyeTest) {
      existingEyeTest.set(eyeTestPayload);
      eyeTest = await existingEyeTest.save();
      statusCode = 200;
    } else {
      eyeTest = await EyeTest.create(eyeTestPayload);
    }

    res.status(statusCode).json({
      success: true,
      message: existingEyeTest ? 'Eye test updated successfully' : 'Eye test saved successfully',
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

    const eyeTests = await EyeTest.find(filter).sort({ createdAt: -1, updatedAt: -1 });
    const dedupedEyeTests = [];
    const seenKeys = new Set();

    for (const item of eyeTests) {
      const key = `${normalizePhone(item.mobileNumber)}::${normalizeName(item.name)}`;

      if (seenKeys.has(key)) {
        continue;
      }

      seenKeys.add(key);
      dedupedEyeTests.push(item);
    }

    res.json({ success: true, data: dedupedEyeTests });
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
