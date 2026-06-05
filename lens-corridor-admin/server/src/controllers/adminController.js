const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase(), status: 'active' });
    if (!admin) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
        return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        { id: admin._id, email: admin.email, name: admin.name, role: admin.role },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: '1h' }
    );

    res.json({
        token,
        user: { id: admin._id, email: admin.email, name: admin.name, role: admin.role }
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
