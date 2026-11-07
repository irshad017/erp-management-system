const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');

// Helper to generate unique PO number
const generatePONumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await PurchaseOrder.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `PO-${dateStr}-${sequence}`;
};

// @desc    Get all purchase orders (paginated, searched, filtered)
// @route   GET /api/purchase-orders
// @access  Private
const getPurchaseOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {};
    if (search) {
      query.poNumber = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const total = await PurchaseOrder.countDocuments(query);
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('supplier', 'name email company phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: purchaseOrders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: purchaseOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single purchase order
// @route   GET /api/purchase-orders/:id
// @access  Private
const getPurchaseOrderById = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id)
      .populate('supplier')
      .populate('createdBy', 'name email');

    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    res.status(200).json({ success: true, data: po });
  } catch (err) {
    next(err);
  }
};

// @desc    Create purchase order
// @route   POST /api/purchase-orders
// @access  Private (Admin, Purchase)
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items, expectedDate, notes, status = 'Issued' } = req.body;

    if (!supplier) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one order line item' });
    }

    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    let totalCost = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for ID: ${item.product}` });
      }

      const qty = Number(item.quantity);
      const unitCost = Number(item.unitCost || product.costPrice || product.price * 0.7);
      const subtotal = qty * unitCost;

      totalCost += subtotal;

      processedItems.push({
        product: product._id,
        title: product.title,
        SKU: product.SKU,
        quantity: qty,
        unitCost,
        subtotal
      });
    }

    const poNumber = await generatePONumber();

    const newPO = await PurchaseOrder.create({
      poNumber,
      supplier,
      items: processedItems,
      totalCost,
      status,
      expectedDate: expectedDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: req.user ? req.user._id : null,
      notes: notes || ''
    });

    const populatedPO = await PurchaseOrder.findById(newPO._id)
      .populate('supplier', 'name email company phone')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Purchase Order created successfully',
      data: populatedPO
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update purchase order
// @route   PUT /api/purchase-orders/:id
// @access  Private (Admin, Purchase)
const updatePurchaseOrder = async (req, res, next) => {
  try {
    const { status, notes, expectedDate } = req.body;

    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    if (status) po.status = status;
    if (notes !== undefined) po.notes = notes;
    if (expectedDate) po.expectedDate = expectedDate;

    await po.save();

    const updated = await PurchaseOrder.findById(po._id)
      .populate('supplier', 'name email company phone')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Purchase Order updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete purchase order
// @route   DELETE /api/purchase-orders/:id
// @access  Private (Admin)
const deletePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase order not found' });
    }

    await PurchaseOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Purchase order deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder
};
