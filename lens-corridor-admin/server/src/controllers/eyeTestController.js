const EyeTest = require('../models/EyeTest');

const normalizePhone = (value = '') => String(value).replace(/\D/g, '').slice(-10);

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

    // If same power in both eyes, mirror right → left
    const finalSpherical = samePowerBothEyes
      ? { right: spherical?.right, left: spherical?.right }
      : spherical;

    const eyeTest = await EyeTest.create({
      samePowerBothEyes,
      hasCylindricalPower,
      spherical: finalSpherical,
      cylindrical: hasCylindricalPower ? cylindrical : null,
      axis:        hasCylindricalPower ? axis        : null,
      name,
      mobileNumber,
      email,
      address,
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
