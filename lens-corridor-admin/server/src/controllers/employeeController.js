const bcrypt = require('bcryptjs');

const Employee = require('../models/Employee');
const { buildManagerStoreFilter } = require('../utils/accessScope');
const normalizePin = (value = '') => String(value).replace(/\D/g, '').slice(0, 6);
const generateSalesmanId = async () => {
  const existingEmployees = await Employee.find({}, 'salesmanId').lean();
  const maxSequence = existingEmployees.reduce((highest, employee) => {
    const match = String(employee?.salesmanId || '').match(/^LC(\d+)$/i);

    if (!match) {
      return highest;
    }

    const sequence = Number.parseInt(match[1], 10);
    return Number.isNaN(sequence) ? highest : Math.max(highest, sequence);
  }, 100);

  return `LC${maxSequence + 1}`;
};

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

const listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find(buildManagerStoreFilter(req.user, 'store'))
      .populate('store', 'storeName storeCode')
      .sort({ createdAt: -1 });

    res.json(employees.map(sanitizeEmployee));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { salesmanId, name, email, phone, role, store, password, pin, status } = req.body;

    const normalizedPin = normalizePin(pin);
    const normalizedPassword = String(password ?? '').trim();

    if (!name || !email || !normalizedPassword || !normalizedPin) {
      return res.status(400).json({ error: 'Name, email, password, and PIN are required' });
    }

    if (normalizedPin.length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    const hashedPin = await bcrypt.hash(normalizedPin, 10);
    const generatedSalesmanId = salesmanId?.trim().toUpperCase() || await generateSalesmanId();

    const employee = await Employee.create({
      salesmanId: generatedSalesmanId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      role: role || 'Salesman',
      store: store || null,
      password: hashedPassword,
      pin: hashedPin,
      status: status || 'Active',
    });

    const populatedEmployee = await Employee.findById(employee._id).populate('store', 'storeName storeCode');
    res.status(201).json(sanitizeEmployee(populatedEmployee));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Salesman ID or email already exists' });
    }

    res.status(500).json({ error: 'Failed to create employee' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { salesmanId, name, email, phone, role, store, password, pin, status } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (salesmanId?.trim()) {
      employee.salesmanId = salesmanId.trim().toUpperCase();
    }
    if (name) employee.name = name.trim();
    if (email) employee.email = email.trim().toLowerCase();
    employee.phone = phone?.trim() || '';
    employee.role = role || employee.role;
    employee.store = store || null;
    employee.status = status || employee.status;

    const normalizedPassword = String(password ?? '').trim();
    const normalizedPin = normalizePin(pin);

    if (normalizedPassword) {
      if (normalizedPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      employee.password = await bcrypt.hash(normalizedPassword, 10);
    }

    if (normalizedPin) {
      if (normalizedPin.length < 4) {
        return res.status(400).json({ error: 'PIN must be at least 4 digits' });
      }

      employee.pin = await bcrypt.hash(normalizedPin, 10);
    }

    await employee.save();

    const populatedEmployee = await Employee.findById(employee._id).populate('store', 'storeName storeCode');
    res.json(sanitizeEmployee(populatedEmployee));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Salesman ID or email already exists' });
    }

    res.status(500).json({ error: 'Failed to update employee' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete employee' });
  }
};

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
