const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all suppliers (paginated & searched)
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: suppliers
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single supplier by ID + POs
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const recentPurchaseOrders = await PurchaseOrder.find({ supplier: req.params.id })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: supplier,
      recentPurchaseOrders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private (Admin, Purchase)
const createSupplier = async (req, res, next) => {
  try {
    const { name, email, phone, company, address, paymentTerms, notes } = req.body;

    const supplier = await Supplier.create({
      name,
      email,
      phone,
      company: company || '',
      address: address || {},
      paymentTerms: paymentTerms || 'Net 30',
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private (Admin, Purchase)
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private (Admin)
const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
