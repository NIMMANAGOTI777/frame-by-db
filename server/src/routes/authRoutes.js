const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Admin Auth mapped to /api/auth
router.post('/', authController.adminLogin);
router.get('/', verifyAdmin, authController.adminMe);
router.delete('/', authController.adminLogout);

module.exports = router;
