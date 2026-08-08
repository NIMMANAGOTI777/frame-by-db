const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: String,
  status: {
    type: String,
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);
