const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  }
}, { _id: false });

const historySchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  notes: String,
  history: {
    type: [historySchema],
    default: []
  },
  items: {
    type: [invoiceItemSchema],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
