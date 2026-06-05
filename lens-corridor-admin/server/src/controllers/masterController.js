const LensCategory = require('../models/LensCategory');
const Coating = require('../models/Coating');
const EyePower = require('../models/EyePower');

const normalizePowerTypeIds = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return [value];
};

const masterConfig = {
  'lens-category': {
    model: LensCategory,
    query: () =>
      LensCategory.find()
        .populate('powertype_id', 'name tag priority')
        .sort({ priority: 1, categoryName: 1 }),
  },
  coating: {
    model: Coating,
    query: () => Coating.find().populate('compatibleLensTypes', 'typeName').sort({ priority: 1, coatingName: 1 }),
  },
  eyepower: {
    model: EyePower,
    query: () => EyePower.find().sort({ eye: 1, sphere: 1, cylinder: 1 }),
  },
};

const getMasterItems = async (req, res) => {
  const { section } = req.params;
  const config = masterConfig[section];

  if (!config) {
    return res.status(404).json({ error: 'Master section not found' });
  }

  try {
    const items = await config.query();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch master items' });
  }
};

const updateMasterItem = async (req, res) => {
  const { section, id } = req.params;
  const config = masterConfig[section];

  if (!config) {
    return res.status(404).json({ error: 'Master section not found' });
  }

  try {
    // For now: allow only whitelisted fields per master type.
    // Lens Category: include powertype_id for dropdown mapping.
    let update = req.body || {}

    if (section === 'lens-category') {
      update = {
        categoryName: update.categoryName,
        displayLabel: update.displayLabel,
        linkedPricingBand: update.linkedPricingBand,
        description: update.description,
        powertype_id: normalizePowerTypeIds(update.powertype_id),
        priority: update.priority,
        internalCode: update.internalCode,
        usageAndMapping: update.usageAndMapping,
        status: update.status,
      }

      // remove undefined keys so they don't overwrite values
      Object.keys(update).forEach((k) => {
        if (update[k] === undefined) delete update[k]
      })
    }

    const updated = await config.model.findByIdAndUpdate(id, update, {
      new: true,
    })

    if (!updated) {
      return res.status(404).json({ error: 'Record not found' })
    }

    // re-fetch with populate where needed
    const populated = section === 'lens-category'
      ? await config.model.findById(updated._id).populate('powertype_id', 'name tag priority')
      : updated

    res.json(populated)
  } catch (error) {
    res.status(500).json({ error: 'Failed to update master item', details: error.message })
  }
};

module.exports = { getMasterItems, updateMasterItem };
