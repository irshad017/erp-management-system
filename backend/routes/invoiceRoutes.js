const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(authorize('admin', 'sales'), createInvoice);

router.route('/:id')
  .get(getInvoiceById);

router.route('/:id/status')
  .put(authorize('admin', 'sales'), updateInvoiceStatus);

module.exports = router;

