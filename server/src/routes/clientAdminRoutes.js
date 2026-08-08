const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Admin Client Endpoints mapped to /api/admin/clients
router.get('/', verifyAdmin, clientController.getClients);
router.post('/', verifyAdmin, clientController.createClient);

module.exports = router;
