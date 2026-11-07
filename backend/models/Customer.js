const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    company: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Contact phone number is required'],
      trim: true
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'USA' }
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

customerSchema.index({ name: 'text', email: 'text', company: 'text' });

module.exports = mongoose.model('Customer', customerSchema);
