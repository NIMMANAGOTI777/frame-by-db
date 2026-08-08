const Booking = require('../models/Booking');
const Client = require('../models/Client');
const generateBookingId = require('../utils/generateBookingId');

// Create Booking
async function createBooking(req, res) {
  try {
    const bookingData = req.body;
    if (!bookingData.email || !bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.eventType || !bookingData.location) {
      return res.status(400).json({ success: false, error: 'Required booking fields are missing' });
    }

    // Find or create Client
    let client = await Client.findOne({ email: bookingData.email.trim().toLowerCase() });
    const accessKey = bookingData.accessKey || `KEY-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!client) {
      client = new Client({
        name: bookingData.name,
        email: bookingData.email.trim().toLowerCase(),
        phone: bookingData.phone,
        accessKey,
        companyName: '',
        billingAddress: bookingData.location,
        downloads: [],
        albumPhotos: []
      });
      await client.save();
    }

    // Parse budget
    let parsedBudget = null;
    if (bookingData.budget !== undefined && bookingData.budget !== null && bookingData.budget !== '') {
      parsedBudget = typeof bookingData.budget === 'number' ? bookingData.budget : parseFloat(String(bookingData.budget).replace(/[^0-9.]/g, ''));
    }

    // Generate Booking ID
    const bookingId = await generateBookingId();

    const newBooking = new Booking({
      bookingId,
      clientId: client._id,
      name: bookingData.name,
      phone: bookingData.phone,
      email: bookingData.email.trim().toLowerCase(),
      date: new Date(bookingData.date),
      eventType: bookingData.eventType,
      location: bookingData.location,
      budget: parsedBudget,
      message: bookingData.message || '',
      status: 'New',
      paymentStatus: 'pending'
    });

    const savedBooking = await newBooking.save();

    // Emit Socket.IO Event
    const io = req.app.get('socketio');
    if (io) {
      // Append client ID so frontend matches the shape
      const socketPayload = {
        ...savedBooking.toObject(),
        id: savedBooking._id.toString(), // map MongoDB _id to frontend expected 'id'
        clientId: client._id.toString(),
        date: savedBooking.date.toISOString()
      };
      io.emit('new-booking', socketPayload);
      console.log('Socket.IO: Emitted new-booking event for', bookingId);
    }

    return res.status(201).json({
      success: true,
      bookingId: savedBooking.bookingId,
      data: {
        ...savedBooking.toObject(),
        id: savedBooking._id.toString(),
        clientId: client._id.toString()
      }
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Get Bookings (Admin panel)
async function getBookings(req, res) {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    // Map _id to id for frontend compatibility
    const mapped = bookings.map(b => ({
      ...b.toObject(),
      id: b._id.toString(),
      clientId: b.clientId ? b.clientId.toString() : null
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Get Booking by ID
async function getBookingById(req, res) {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    return res.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      clientId: booking.clientId ? booking.clientId.toString() : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update Booking Status
async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      clientId: booking.clientId ? booking.clientId.toString() : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Update Booking
async function updateBooking(req, res) {
  try {
    const updates = { ...req.body };
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.budget !== undefined && updates.budget !== null && updates.budget !== '') {
      updates.budget = typeof updates.budget === 'number' ? updates.budget : parseFloat(String(updates.budget).replace(/[^0-9.]/g, ''));
    }
    // Delete non-modifiable metadata fields
    delete updates._id;
    delete updates.id;
    delete updates.bookingId;
    delete updates.clientId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    return res.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      clientId: booking.clientId ? booking.clientId.toString() : null
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Delete Booking
async function deleteBooking(req, res) {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }
    return res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateStatus,
  updateBooking,
  deleteBooking
};
