const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');

// Admin: Get all clients
async function getClients(req, res) {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    const mapped = clients.map(c => ({
      ...c.toObject(),
      id: c._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Create client
async function createClient(req, res) {
  try {
    const { name, email, phone, companyName, billingAddress } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Name, email, and phone are required' });
    }

    const exists = await Client.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, error: 'Client with this email already exists' });
    }

    const accessKey = `KEY-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClient = new Client({
      name,
      email: email.trim().toLowerCase(),
      phone,
      companyName: companyName || '',
      billingAddress: billingAddress || '',
      accessKey,
      downloads: [],
      albumPhotos: []
    });

    const saved = await newClient.save();
    return res.status(201).json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Get profile
async function getProfile(req, res) {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    return res.json({
      ...client.toObject(),
      id: client._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Update profile
async function updateProfile(req, res) {
  try {
    const { name, phone, companyName, billingAddress } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.user.id,
      { name, phone, companyName, billingAddress },
      { new: true }
    );
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }
    return res.json({
      success: true,
      client: {
        ...client.toObject(),
        id: client._id.toString()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Get dashboard data
async function getDashboard(req, res) {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    // Load matching bookings by email
    const clientBookings = await Booking.find({
      email: client.email.trim().toLowerCase()
    }).sort({ createdAt: -1 });

    // Load client invoices
    const clientInvoices = await Invoice.find({ clientId: client._id }).sort({ createdAt: -1 });
    const invoiceIds = clientInvoices.map(inv => inv._id);

    // Load payments for those invoices
    const clientPayments = await Payment.find({ invoiceId: { $in: invoiceIds } }).sort({ createdAt: -1 });

    // Calculations
    const totalBookings = clientBookings.length;
    const totalPaid = clientPayments
      .filter(pm => pm.status === 'Success')
      .reduce((sum, pm) => sum + pm.amount, 0);

    const pendingBalance = clientInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const activeProjects = clientBookings.filter(b => b.status === 'Confirmed').length; // confirmed bookings map to active projects
    const availableDownloads = client.downloads || [];

    // Timeline creation logic
    const latestBooking = clientBookings[0] || null;
    let timeline = [];

    if (latestBooking) {
      const createdDate = new Date(latestBooking.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const isNew = latestBooking.status === 'New';
      const isConfirmed = latestBooking.status === 'Confirmed';
      const isCompleted = latestBooking.status === 'Shoot Completed';
      const isCancelled = latestBooking.status === 'Cancelled';

      timeline = [
        {
          label: 'Inquiry Submitted',
          status: 'completed',
          date: createdDate
        },
        {
          label: 'Review & Schedule Approval',
          status: isNew ? 'active' : 'completed',
          date: isNew ? 'Pending Review' : 'Approved'
        },
        {
          label: 'Pre-production Planning',
          status: isNew ? 'pending' : isConfirmed ? 'active' : 'completed',
          date: isConfirmed ? 'In Progress' : isNew ? 'TBD' : 'Completed'
        },
        {
          label: 'Main Production Shoot',
          status: isCompleted ? 'completed' : isConfirmed ? 'pending' : 'pending',
          date: latestBooking.date.toISOString().split('T')[0]
        },
        {
          label: 'Post-production Editing & Album Binding',
          status: isCompleted ? 'active' : 'pending',
          date: 'Est. 4-6 weeks post shoot'
        }
      ];

      if (isCancelled) {
        timeline[1] = {
          label: 'Inquiry Cancelled',
          status: 'failed',
          date: 'Cancelled'
        };
      }
    }

    // Map _id to id for invoices and payments for frontend compatibility
    const mappedInvoices = clientInvoices.map(inv => ({
      ...inv.toObject(),
      id: inv._id.toString(),
      clientId: inv.clientId.toString(),
      bookingId: inv.bookingId ? inv.bookingId.toString() : null
    }));

    const mappedPayments = clientPayments.map(pm => ({
      ...pm.toObject(),
      id: pm._id.toString(),
      invoiceId: pm.invoiceId.toString()
    }));

    const mappedBookings = clientBookings.map(b => ({
      ...b.toObject(),
      id: b._id.toString(),
      clientId: b.clientId ? b.clientId.toString() : null,
      date: b.date.toISOString().split('T')[0]
    }));

    return res.json({
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email
      },
      stats: {
        totalBookings,
        totalPaid,
        pendingBalance,
        activeProjects,
        availableDownloadsCount: availableDownloads.length
      },
      recentInvoices: mappedInvoices.slice(0, 5),
      recentPayments: mappedPayments.slice(0, 5),
      downloads: availableDownloads,
      albumPhotos: client.albumPhotos || [],
      timeline,
      bookings: mappedBookings
    });
  } catch (error) {
    console.error('Client dashboard error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getClients,
  createClient,
  getProfile,
  updateProfile,
  getDashboard
};
