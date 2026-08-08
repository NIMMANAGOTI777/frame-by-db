const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  label: String,
  size: String,
  url: String
}, { _id: false });

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    default: ''
  },
  billingAddress: {
    type: String,
    default: ''
  },
  accessKey: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  downloads: {
    type: [downloadSchema],
    default: []
  },
  albumPhotos: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Client', clientSchema);
