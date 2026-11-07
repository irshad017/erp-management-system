const SalesOrder = require('../models/SalesOrder');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

// Helper to generate unique order number
const generateOrderNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await SalesOrder.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `SO-${dateStr}-${sequence}`;
};

// @desc    Get all sales orders (paginated, searched, filtered)
// @route   GET /api/sales-orders
// @access  Private
const getSalesOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const paymentStatus = req.query.paymentStatus || '';

    const query = {};
    if (search) {
      query.orderNumber = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const total = await SalesOrder.countDocuments(query);
    const salesOrders = await SalesOrder.find(query)
      .populate('customer', 'name email company phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: salesOrders.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: salesOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single sales order
// @route   GET /api/sales-orders/:id
// @access  Private
const getSalesOrderById = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name email')
      .populate('invoiceId');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @desc    Create sales order
// @route   POST /api/sales-orders
// @access  Private (Admin, Sales)
const createSalesOrder = async (req, res, next) => {
  try {
    const { customer, items, taxRate = 8, discount = 0, status = 'Confirmed', notes } = req.body;

    if (!customer) {
      return res.status(400).json({ success: false, message: 'Customer is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one order line item' });
    }

    // Verify customer exists
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    // Process line items & check stock
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found for ID: ${item.product}` });
      }

      const qty = Number(item.quantity);
      const unitPrice = Number(item.unitPrice || product.price);
      const lineSubtotal = qty * unitPrice;

      subtotal += lineSubtotal;

      processedItems.push({
        product: product._id,
        title: product.title,
        SKU: product.SKU,
        quantity: qty,
        unitPrice,
        subtotal: lineSubtotal
      });

      // Deduct stock if order is confirmed/processing
      if (['Confirmed', 'Processing', 'Shipped'].includes(status)) {
        product.stock = Math.max(0, product.stock - qty);
        await product.save();
      }
    }

    const calculatedTax = (subtotal * (Number(taxRate) / 100));
    const totalPrice = Math.max(0, subtotal + calculatedTax - Number(discount));
    const orderNumber = await generateOrderNumber();

    const newOrder = await SalesOrder.create({
      orderNumber,
      customer,
      items: processedItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount: calculatedTax,
      discount: Number(discount),
      totalPrice,
      status,
      paymentStatus: 'Unpaid',
      createdBy: req.user ? req.user._id : null,
      notes: notes || ''
    });

    const populatedOrder = await SalesOrder.findById(newOrder._id)
      .populate('customer', 'name email company phone')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Sales Order created successfully',
      data: populatedOrder
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update sales order status or notes
// @route   PUT /api/sales-orders/:id
// @access  Private (Admin, Sales)
const updateSalesOrder = async (req, res, next) => {
  try {
    const { status, paymentStatus, notes } = req.body;

    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (notes !== undefined) order.notes = notes;

    await order.save();

    const updated = await SalesOrder.findById(order._id)
      .populate('customer', 'name email company phone')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Sales Order updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete sales order
// @route   DELETE /api/sales-orders/:id
// @access  Private (Admin)
const deleteSalesOrder = async (req, res, next) => {
  try {
    const order = await SalesOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Sales order not found' });
    }

    await SalesOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Sales order deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder
};

