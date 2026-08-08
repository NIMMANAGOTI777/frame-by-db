const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.post('/', bookingController.createBooking);
router.get('/', verifyAdmin, bookingController.getBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id', verifyAdmin, bookingController.updateBooking);
router.patch('/:id/status', verifyAdmin, bookingController.updateStatus);
router.delete('/:id', verifyAdmin, bookingController.deleteBooking);

module.exports = router;
