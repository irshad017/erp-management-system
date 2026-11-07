const Invoice = require('../models/Invoice');
const SalesOrder = require('../models/SalesOrder');
const Customer = require('../models/Customer');

// Helper to generate unique Invoice number
const generateInvoiceNumber = async () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Invoice.countDocuments();
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${dateStr}-${sequence}`;
};

// @desc    Get all invoices (paginated, searched, filtered)
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';

    const query = {};
    if (search) {
      query.invoiceNumber = { $regex: search, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('customer', 'name email company phone address')
      .populate('salesOrder', 'orderNumber totalPrice')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: invoices
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customer')
      .populate('salesOrder')
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

// @desc    Create invoice (either from sales order or custom)
// @route   POST /api/invoices
// @access  Private (Admin, Sales)
const createInvoice = async (req, res, next) => {
  try {
    const { salesOrderId, customerId, items, dueDate, taxRate = 8, discount = 0, notes } = req.body;

    let targetCustomer = customerId;
    let targetItems = items;
    let subtotal = 0;
    let soRef = null;

    // If generated from a Sales Order
    if (salesOrderId) {
      const salesOrder = await SalesOrder.findById(salesOrderId);
      if (!salesOrder) {
        return res.status(404).json({ success: false, message: 'Referenced Sales Order not found' });
      }

      soRef = salesOrder._id;
      targetCustomer = salesOrder.customer;
      targetItems = salesOrder.items.map((i) => ({
        product: i.product,
        title: i.title,
        SKU: i.SKU,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        subtotal: i.subtotal
      }));
      subtotal = salesOrder.subtotal;
    } else {
      if (!customerId) {
        return res.status(400).json({ success: false, message: 'Customer ID is required' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one line item is required' });
      }

      targetItems.forEach((it) => {
        subtotal += Number(it.quantity) * Number(it.unitPrice);
      });
    }

    const customerDoc = await Customer.findById(targetCustomer);
    if (!customerDoc) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const calculatedTax = (subtotal * (Number(taxRate) / 100));
    const totalAmount = Math.max(0, subtotal + calculatedTax - Number(discount));
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      salesOrder: soRef,
      customer: targetCustomer,
      items: targetItems,
      subtotal,
      taxRate: Number(taxRate),
      taxAmount: calculatedTax,
      discount: Number(discount),
      totalAmount,
      status: 'Unpaid',
      issuedDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days net
      notes: notes || 'Payment is due within 14 days. Thank you for your business!',
      createdBy: req.user ? req.user._id : null
    });

    // Update SalesOrder if applicable
    if (salesOrderId) {
      await SalesOrder.findByIdAndUpdate(salesOrderId, {
        isInvoiced: true,
        invoiceId: invoice._id
      });
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate('customer', 'name email company phone address')
      .populate('salesOrder', 'orderNumber')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: populatedInvoice
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update invoice status (Paid, Unpaid, Overdue)
// @route   PUT /api/invoices/:id/status
// @access  Private (Admin, Sales)
const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status, paymentMethod } = req.body;

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (status) invoice.status = status;
    if (paymentMethod) invoice.paymentMethod = paymentMethod;

    if (status === 'Paid') {
      invoice.paymentDate = new Date();

      // If linked to sales order, mark sales order as Paid
      if (invoice.salesOrder) {
        await SalesOrder.findByIdAndUpdate(invoice.salesOrder, {
          paymentStatus: 'Paid'
        });
      }
    }

    await invoice.save();

    const updated = await Invoice.findById(invoice._id)
      .populate('customer', 'name email company phone address')
      .populate('salesOrder', 'orderNumber')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: 'Invoice status updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus
};

