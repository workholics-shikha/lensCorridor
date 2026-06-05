const LensCategory = require('../models/LensCategory');

const getLensCategories = async (req, res) => {
  try {
    const { powerTypeId } = req.query;
    const query = { status: 'Active' };

    if (powerTypeId) {
      query.powertype_id = powerTypeId;
    }

    const items = await LensCategory.find(query)
      .populate('powertype_id', 'name tag priority')
      .sort({ priority: 1, categoryName: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items.map((item) => ({
        ...item.toObject(),
        id: item._id.toString(),
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = { getLensCategories };
