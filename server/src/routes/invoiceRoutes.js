const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyAdmin, verifyClient } = require('../middleware/authMiddleware');

// Admin Invoice Endpoints
router.get('/admin', verifyAdmin, invoiceController.getInvoices);
router.post('/admin', verifyAdmin, invoiceController.createInvoice);
router.post('/admin/:id/duplicate', verifyAdmin, invoiceController.duplicateInvoice);
router.post('/admin/:id/send', verifyAdmin, invoiceController.sendInvoice);
router.delete('/admin/:id', verifyAdmin, invoiceController.deleteInvoice);

// Client Invoice Endpoints
router.get('/client', verifyClient, invoiceController.getClientInvoices);
router.get('/client/:id', verifyClient, invoiceController.getClientInvoiceById);
router.post('/client/pay', verifyClient, invoiceController.clientPayInvoice);

module.exports = router;
