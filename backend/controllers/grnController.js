const GRN = require('../models/GRN');
const PurchaseOrder = require('../models/PurchaseOrder');
const Product = require('../models/Product');

// Helper to generate unique GRN number
const generateGRNNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await GRN.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `GRN-${dateStr}-${sequence}`;
};

// @desc    Get all Goods Receipt Notes (paginated, searched)
// @route   GET /api/grn
// @access  Private
const getGRNs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { grnNumber: { $regex: search, $options: 'i' } },
        { deliveryNoteNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await GRN.countDocuments(query);
    const grns = await GRN.find(query)
      .populate('purchaseOrder', 'poNumber totalCost status')
      .populate('supplier', 'name company phone')
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: grns.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: grns
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single GRN by ID
// @route   GET /api/grn/:id
// @access  Private
const getGRNById = async (req, res, next) => {
  try {
    const grn = await GRN.findById(req.params.id)
      .populate('purchaseOrder')
      .populate('supplier')
      .populate('receivedBy', 'name email');

    if (!grn) {
      return res.status(404).json({ success: false, message: 'Goods Receipt Note not found' });
    }

    res.status(200).json({ success: true, data: grn });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Goods Receipt Note (updates inventory stock and PO status)
// @route   POST /api/grn
// @access  Private (Admin, Inventory, Purchase)
const createGRN = async (req, res, next) => {
  try {
    const { purchaseOrderId, deliveryNoteNumber, receivedItems, notes } = req.body;

    if (!purchaseOrderId) {
      return res.status(400).json({ success: false, message: 'Purchase Order ID is required' });
    }

    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, message: 'Referenced Purchase Order not found' });
    }

    if (purchaseOrder.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot receive items against a cancelled Purchase Order' });
    }

    if (!receivedItems || !Array.isArray(receivedItems) || receivedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Please specify received items' });
    }

    // Process received items & update Product inventory stock
    const processedItems = [];
    let allItemsFullyReceived = true;

    for (const item of receivedItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for ID: ${item.product}` });
      }

      const receivedQty = Number(item.receivedQuantity);
      const orderedQty = Number(item.orderedQuantity);

      if (receivedQty < orderedQty) {
        allItemsFullyReceived = false;
      }

      // Automatically increment product stock in database!
      product.stock += receivedQty;
      await product.save();

      processedItems.push({
        product: product._id,
        title: product.title,
        SKU: product.SKU,
        orderedQuantity: orderedQty,
        receivedQuantity: receivedQty,
        unitCost: item.unitCost || 0,
        remarks: item.remarks || 'Accepted'
      });
    }

    // Update PurchaseOrder status
    purchaseOrder.status = allItemsFullyReceived ? 'Received' : 'Partially Received';
    await purchaseOrder.save();

    const grnNumber = await generateGRNNumber();

    const newGRN = await GRN.create({
      grnNumber,
      purchaseOrder: purchaseOrder._id,
      supplier: purchaseOrder.supplier,
      receivedItems: processedItems,
      deliveryNoteNumber: deliveryNoteNumber || '',
      receivedBy: req.user ? req.user._id : null,
      status: 'Completed',
      notes: notes || ''
    });

    const populatedGRN = await GRN.findById(newGRN._id)
      .populate('purchaseOrder', 'poNumber totalCost status')
      .populate('supplier', 'name company phone')
      .populate('receivedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Goods Receipt Note created and inventory stock updated successfully',
      data: populatedGRN
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getGRNs,
  getGRNById,
  createGRN
};
