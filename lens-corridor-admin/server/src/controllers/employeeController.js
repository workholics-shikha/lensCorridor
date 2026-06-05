const bcrypt = require('bcryptjs');

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

const listEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('store', 'storeName storeCode')
      .sort({ createdAt: -1 });

    res.json(employees.map(sanitizeEmployee));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { salesmanId, name, email, phone, role, store, password, status } = req.body;

    if (!salesmanId || !name || !email || !password) {
      return res.status(400).json({ error: 'Salesman ID, name, email, and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      salesmanId: salesmanId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      role: role || 'Salesman',
      store: store || null,
      password: hashedPassword,
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
    const { salesmanId, name, email, phone, role, store, password, status } = req.body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (salesmanId) employee.salesmanId = salesmanId.trim().toUpperCase();
    if (name) employee.name = name.trim();
    if (email) employee.email = email.trim().toLowerCase();
    employee.phone = phone?.trim() || '';
    employee.role = role || employee.role;
    employee.store = store || null;
    employee.status = status || employee.status;

    if (password) {
      employee.password = await bcrypt.hash(password, 10);
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
