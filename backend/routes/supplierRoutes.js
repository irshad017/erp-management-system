const express = require('express');
const router = express.Router();
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(authorize('admin', 'purchase'), createSupplier);

router.route('/:id')
  .get(getSupplierById)
  .put(authorize('admin', 'purchase'), updateSupplier)
  .delete(authorize('admin'), deleteSupplier);

module.exports = router;
