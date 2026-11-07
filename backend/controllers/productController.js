const Product = require('../models/Product');

// @desc    Get all products (paginated, filtered, searched)
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const stockStatus = req.query.status || '';

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { SKU: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    if (stockStatus === 'low') {
      query.$expr = { $lte: ['$stock', '$reorderLevel'] };
    } else if (stockStatus === 'out') {
      query.stock = 0;
    } else if (stockStatus === 'in') {
      query.$expr = { $gt: ['$stock', '$reorderLevel'] };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get categories for filter dropdown
    const categories = await Product.distinct('category');

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      categories,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private (Admin, Inventory, Purchase)
const createProduct = async (req, res, next) => {
  try {
    const { title, SKU, category, description, price, costPrice, stock, reorderLevel, unit } = req.body;

    // Check SKU uniqueness
    const existingSKU = await Product.findOne({ SKU: SKU.toUpperCase().trim() });
    if (existingSKU) {
      return res.status(400).json({
        success: false,
        message: `Product with SKU '${SKU.toUpperCase().trim()}' already exists`
      });
    }

    const product = await Product.create({
      title,
      SKU: SKU.toUpperCase().trim(),
      category: category || 'General',
      description,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      stock: Number(stock) || 0,
      reorderLevel: Number(reorderLevel) || 10,
      unit: unit || 'Units'
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin, Inventory, Purchase)
const updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.body.SKU && req.body.SKU.toUpperCase().trim() !== product.SKU) {
      const duplicate = await Product.findOne({
        SKU: req.body.SKU.toUpperCase().trim(),
        _id: { $ne: product._id }
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `SKU '${req.body.SKU}' is already in use by another product`
        });
      }
      req.body.SKU = req.body.SKU.toUpperCase().trim();
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin, Inventory)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get low stock alerts
// @route   GET /api/products/alerts/low-stock
// @access  Private
const getLowStockAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$stock', '$reorderLevel'] }
    }).sort({ stock: 1 });

    res.status(200).json({
      success: true,
      count: lowStockProducts.length,
      data: lowStockProducts
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockAlerts
};

