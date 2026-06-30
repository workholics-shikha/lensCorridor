const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');
const { normalizeAdminEmail } = require('../utils/ensureDefaultAdmin');

const login = async (req, res) => {
    const email = normalizeAdminEmail(req.body?.email);
    const { password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), status: 'active' });

    if (admin) {
        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, name: admin.name, role: admin.role, source: 'admin' },
            process.env.JWT_SECRET || 'your_secret_key',
            { expiresIn: '1h' }
        );

        return res.json({
            token,
            user: { id: admin._id, email: admin.email, name: admin.name, role: admin.role, source: 'admin' }
        });
    }

    const manager = await Employee.findOne({
        status: 'Active',
        role: 'Manager',
        $or: [
            { email: email.toLowerCase() },
            { salesmanId: String(req.body?.email ?? '').trim().toUpperCase() },
        ],
    });

    if (!manager) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidManagerPassword = await bcrypt.compare(password, manager.password);
    if (!isValidManagerPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            id: manager._id,
            email: manager.email,
            name: manager.name,
            role: 'manager',
            source: 'employee',
            employeeId: manager.salesmanId,
        },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '1h' }
    );

    return res.json({
        token,
        user: {
            id: manager._id,
            email: manager.email,
            name: manager.name,
            role: 'manager',
            source: 'employee',
            employeeId: manager.salesmanId,
        }
    });
};

const logout = (req, res) => {
    // Client-side token removal
    res.json({ message: 'Logged out successfully' });
};

const getProfile = (req, res) => {
    res.json(req.user);
};

module.exports = { login, logout, getProfile };
