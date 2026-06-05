const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  salesmanId: { type: String, required: true, unique: true, trim: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['Admin', 'Manager', 'Salesman', 'Staff'], default: 'Salesman' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  password: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
