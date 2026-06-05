const Employee = require('../models/Employee');

const sanitizeEmployee = (employee) => ({
    id: employee._id,
    salesmanId: employee.salesmanId,
    name: employee.name,
    email: employee.email,
    phone: employee.phone || '',
    role: employee.role,
    store: employee.store ? {
        id: employee.store._id,
        name: employee.store.storeName,
        code: employee.store.storeCode,
    } : null,
    status: employee.status,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
});

const listSalesmen = async (req, res) => {
    try {
        const { storeId } = req.query;

        const filter = {
            role: 'Salesman',
        };

        if (storeId) {
            filter.store = storeId;
        }

        const salesmen = await Employee.find(filter)
            .populate('store', 'storeName storeCode')
            .sort({ createdAt: -1 });

        res.json(salesmen.map(sanitizeEmployee));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch salesmen' });
    }
};

module.exports = { listSalesmen };

