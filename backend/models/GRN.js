const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  SKU: {
    type: String,
    required: true
  },
  orderedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Ordered quantity must be non-negative']
  },
  receivedQuantity: {
    type: Number,
    required: true,
    min: [0, 'Received quantity must be non-negative']
  },
  unitCost: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String,
    default: 'Passed Quality Inspection'
  }
});

const grnSchema = new mongoose.Schema(
  {
    grnNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    purchaseOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: [true, 'Purchase order reference is required']
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: [true, 'Supplier reference is required']
    },
    receivedItems: {
      type: [grnItemSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'GRN must contain at least one item'
      }
    },
    deliveryNoteNumber: {
      type: String,
      trim: true,
      default: ''
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receivedDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Received', 'Inspected', 'Completed'],
      default: 'Completed'
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

grnSchema.index({ grnNumber: 'text', deliveryNoteNumber: 'text' });

module.exports = mongoose.model('GRN', grnSchema);
