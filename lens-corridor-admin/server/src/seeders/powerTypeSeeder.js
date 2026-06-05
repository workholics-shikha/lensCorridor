const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PowerType = require('../models/PowerType');

dotenv.config();

const powerTypes = [
    {
        name: 'With Power',
        tag: 'Most common',
        description: 'Positive, Negative or Cylindrical',
        image: 'power-type-with-power',
        priority: 1,
        status: 'Active',
    },
    {
        name: 'Zero Power',
        tag: 'BLU Screen lenses',
        description: 'Blue light block for screen protection',
        image: 'power-type-zero-power',
        priority: 2,
        status: 'Active',
    },
    {
        name: 'Reading Power',
        tag: null,
        description: 'With power for near vision only',
        image: 'power-type-reading-power',
        priority: 3,
        status: 'Active',
    },
    {
        name: 'Progressive/Bifocals',
        tag: null,
        description: 'Two powers in one eye',
        image: 'power-type-progressive-bifocals',
        priority: 4,
        status: 'Active',
    },
    {
        name: 'Frame Only',
        tag: null,
        description: 'With no lenses',
        image: 'power-type-frame-only',
        priority: 5,
        status: 'Active',
    },
];

const seedPowerTypes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        // Clear existing
        await PowerType.deleteMany({});
        console.log('Existing power types cleared');

        // Insert new
        const inserted = await PowerType.insertMany(powerTypes);
        console.log(`${inserted.length} power types seeded successfully`);

        process.exit(0);
    } catch (err) {
        console.error('Seeder failed:', err.message);
        process.exit(1);
    }
};

seedPowerTypes();
