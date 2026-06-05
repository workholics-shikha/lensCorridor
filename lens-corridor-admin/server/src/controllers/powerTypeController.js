const PowerType = require('../models/PowerType');

/* =========================
   GET ALL
========================= */

const getAllPowerTypes = async (req, res) => {
  try {
    const powerTypes = await PowerType.find({ status: 'Active' })
      .sort({ priority: 1 });

    res.json({
      success: true,
      count: powerTypes.length,
      data: powerTypes.map((item) => ({
        ...item.toObject(),
        image: item.image || item.icon || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   GET BY ID
========================= */

const getPowerTypeById = async (req, res) => {
  try {
    const powerType = await PowerType.findById(req.params.id);

    if (!powerType) {
      return res.status(404).json({
        success: false,
        message: 'Power type not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...powerType.toObject(),
        image: powerType.image || powerType.icon || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAllPowerTypes, getPowerTypeById };
