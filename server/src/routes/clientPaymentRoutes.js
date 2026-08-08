const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { verifyClient } = require('../middleware/authMiddleware');

// Client Payment Endpoints mapped to /api/client/payments
router.post('/', verifyClient, invoiceController.clientPayInvoice);

module.exports = router;
