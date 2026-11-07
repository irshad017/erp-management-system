const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    SKU: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'General'
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Price must be non-negative']
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price must be non-negative']
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      default: 10,
      min: [0, 'Reorder level cannot be negative']
    },
    unit: {
      type: String,
      default: 'Units',
      trim: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for low stock status
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.reorderLevel;
});

// Virtual status string
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= this.reorderLevel) return 'Low Stock';
  return 'In Stock';
});

// Index for search
productSchema.index({ title: 'text', SKU: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);

