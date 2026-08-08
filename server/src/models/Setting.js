const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  businessName: {
    type: String,
    required: true
  },
  founderName: {
    type: String,
    required: true
  },
  founderImage: String,
  experienceYears: {
    type: Number,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  logoUrl: {
    type: String,
    required: true
  },
  stats: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  awards: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
