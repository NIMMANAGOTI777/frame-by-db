const Booking = require('../models/Booking');

async function generateBookingId() {
  const year = new Date().getFullYear();
  try {
    const latest = await Booking.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextNum = 1;
    if (latest && latest.bookingId) {
      const parts = latest.bookingId.split('-');
      if (parts.length === 3 && parts[1] === String(year)) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          nextNum = parsed + 1;
        }
      }
    }
    const nextNumber = String(nextNum).padStart(6, '0');
    return `BK-${year}-${nextNumber}`;
  } catch (error) {
    // Fallback if db query fails (e.g. during initial seed/mock)
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    return `BK-${year}-${randomSuffix}`;
  }
}

module.exports = generateBookingId;
