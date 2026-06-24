const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const STAFF_LOGIN_ROLES = ['Salesman', 'Staff', 'Manager'];

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
            role: { $in: STAFF_LOGIN_ROLES },
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

const verifySalesmanPin = async (req, res) => {
    try {
        const salesmanId = String(req.body?.salesmanId || '').trim().toUpperCase();
        const pin = String(req.body?.pin || '').trim();

        if (!salesmanId || !pin) {
            return res.status(400).json({ error: 'Salesman ID and PIN are required' });
        }

        const employee = await Employee.findOne({
            salesmanId,
            role: { $in: STAFF_LOGIN_ROLES },
            status: 'Active',
        });

        if (!employee) {
            return res.status(404).json({ error: 'Salesman not found' });
        }

        const isValidPin = await bcrypt.compare(pin, employee.pin);

        if (!isValidPin) {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify PIN' });
    }
};

module.exports = { listSalesmen, verifySalesmanPin };

