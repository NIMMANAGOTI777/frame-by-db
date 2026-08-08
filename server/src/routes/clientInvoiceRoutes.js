const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyClient } = require('../middleware/authMiddleware');

// Client Invoice Endpoints mapped to /api/client/invoices
router.get('/', verifyClient, invoiceController.getClientInvoices);
router.get('/:id', verifyClient, invoiceController.getClientInvoiceById);

module.exports = router;
