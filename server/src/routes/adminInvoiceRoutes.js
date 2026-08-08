const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Admin Invoice Endpoints mapped to /api/admin/invoices
router.get('/', verifyAdmin, invoiceController.getInvoices);
router.post('/', verifyAdmin, invoiceController.createInvoice);
router.post('/:id/duplicate', verifyAdmin, invoiceController.duplicateInvoice);
router.post('/:id/send', verifyAdmin, invoiceController.sendInvoice);
router.delete('/:id', verifyAdmin, invoiceController.deleteInvoice);

module.exports = router;
