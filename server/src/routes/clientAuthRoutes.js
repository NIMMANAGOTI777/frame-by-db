const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyClient } = require('../middleware/authMiddleware');

// Client Auth mapped to /api/client/auth
router.post('/', authController.clientLogin);
router.get('/', verifyClient, authController.clientCheckAuth);
router.delete('/', authController.clientLogout);

module.exports = router;
