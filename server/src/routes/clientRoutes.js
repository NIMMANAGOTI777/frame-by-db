const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { verifyClient } = require('../middleware/authMiddleware');

// Client Portal Endpoints mapped to /api/client
router.get('/profile', verifyClient, clientController.getProfile);
router.put('/profile', verifyClient, clientController.updateProfile);
router.get('/dashboard', verifyClient, clientController.getDashboard);

module.exports = router;
