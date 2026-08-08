const Invoice = require('../models/Invoice');
const Client = require('../models/Client');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Setting = require('../models/Setting');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');
const generateInvoicePDF = require('../utils/generateInvoicePDF');
const sendEmail = require('../utils/sendEmail');
const fs = require('fs');
const path = require('path');

// Admin: Get all invoices
async function getInvoices(req, res) {
  try {
    const invoices = await Invoice.find()
      .populate('clientId')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    const mapped = invoices.map(inv => {
      const obj = inv.toObject();
      return {
        ...obj,
        id: inv._id.toString(),
        clientId: inv.clientId ? {
          ...inv.clientId.toObject(),
          id: inv.clientId._id.toString()
        } : null,
        bookingId: inv.bookingId ? {
          ...inv.bookingId.toObject(),
          id: inv.bookingId._id.toString()
        } : null
      };
    });

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Create invoice
async function createInvoice(req, res) {
  try {
    const body = req.body;
    let {
      invoiceNumber,
      bookingId,
      clientId,
      issueDate,
      dueDate,
      discount,
      tax,
      paidAmount,
      notes,
      items,
      manualClientName,
      manualClientEmail,
      manualClientPhone,
      manualClientAddress,
      shouldSendEmail = true
    } = body;

    let finalClientId = clientId;

    // Handle manual client creation
    if (!finalClientId && manualClientEmail) {
      let client = await Client.findOne({ email: manualClientEmail.trim().toLowerCase() });
      if (!client) {
        client = new Client({
          name: manualClientName || 'Client Name',
          email: manualClientEmail.trim().toLowerCase(),
          phone: manualClientPhone || '0000000000',
          accessKey: `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
          companyName: '',
          billingAddress: manualClientAddress || '',
          downloads: [],
          albumPhotos: []
        });
        await client.save();
      }
      finalClientId = client._id;
    }

    if (!finalClientId) {
      return res.status(400).json({ success: false, error: 'Client identification is required' });
    }

    const client = await Client.findById(finalClientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client profile not found' });
    }

    const parsedItems = items || [];
    const subtotal = parsedItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const total = subtotal + Number(tax || 0) - Number(discount || 0);
    const finalPaid = Number(paidAmount || 0);
    const balanceAmount = Math.max(0, total - finalPaid);
    const status = balanceAmount === 0 ? 'Paid' : 'Draft';

    if (!invoiceNumber) {
      invoiceNumber = await generateInvoiceNumber();
    }

    const history = [{
      action: 'Invoice Generated',
      date: new Date(),
      notes: 'Initial generation'
    }];

    const newInvoice = new Invoice({
      invoiceNumber,
      bookingId: bookingId || null,
      clientId: finalClientId,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // default 15 days
      subtotal,
      tax: Number(tax || 0),
      discount: Number(discount || 0),
      total,
      paidAmount: finalPaid,
      balanceAmount,
      status,
      notes: notes || '',
      history,
      items: parsedItems
    });

    const savedInvoice = await newInvoice.save();

    // Get settings and booking for PDF drawing
    let settings = await Setting.findOne();
    if (!settings) {
      settings = {};
    }
    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    // Generate and save PDF
    await generateInvoicePDF(savedInvoice, client, parsedItems, booking, settings);

    // Optionally email PDF
    if (shouldSendEmail && client.email) {
      try {
        const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${savedInvoice.invoiceNumber} from Frame by DB.\n\nTotal: ₹${savedInvoice.total.toLocaleString('en-IN')}\nDue Date: ${savedInvoice.dueDate.toISOString().split('T')[0]}\n\nLog in to the Client Portal using access key "${client.accessKey}" to access all files.\n\nRegards,\nDasari Bharadwaj`;
        const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
        const dirPath = isVercel ? '/tmp/invoices' : path.join(process.cwd(), 'public', 'invoices');
        const pdfPath = path.join(dirPath, `${savedInvoice.invoiceNumber}.pdf`);

        await sendEmail({
          to: client.email,
          subject: `Invoice ${savedInvoice.invoiceNumber} from Frame by DB`,
          text: emailText,
          attachments: [
            {
              filename: `${savedInvoice.invoiceNumber}.pdf`,
              path: pdfPath
            }
          ]
        });
      } catch (emailErr) {
        console.error('Failed to email invoice PDF:', emailErr);
      }
    }

    return res.status(201).json({
      ...savedInvoice.toObject(),
      id: savedInvoice._id.toString()
    });
  } catch (error) {
    console.error('Invoice creation error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Duplicate Invoice
async function duplicateInvoice(req, res) {
  try {
    const original = await Invoice.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const duplicated = new Invoice({
      ...original.toObject(),
      _id: undefined,
      invoiceNumber,
      status: 'Draft',
      paidAmount: 0,
      balanceAmount: original.total,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      history: [{
        action: 'Invoice Duplicated',
        date: new Date(),
        notes: `Duplicated from ${original.invoiceNumber}`
      }]
    });

    const saved = await duplicated.save();

    // Re-generate PDF
    const client = await Client.findById(saved.clientId);
    const settings = await Setting.findOne() || {};
    const booking = saved.bookingId ? await Booking.findById(saved.bookingId) : null;
    await generateInvoicePDF(saved, client, saved.items, booking, settings);

    return res.json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Send Invoice (Trigger email)
async function sendInvoice(req, res) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const client = await Client.findById(invoice.clientId);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const settings = await Setting.findOne() || {};
    const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;

    // Re-generate PDF in case missing
    await generateInvoicePDF(invoice, client, invoice.items, booking, settings);

    const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
    const dirPath = isVercel ? '/tmp/invoices' : path.join(process.cwd(), 'public', 'invoices');
    const pdfPath = path.join(dirPath, `${invoice.invoiceNumber}.pdf`);

    const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber} from Frame by DB.\n\nTotal: ₹${invoice.total.toLocaleString('en-IN')}\nDue Date: ${invoice.dueDate.toISOString().split('T')[0]}\n\nLog in to the Client Portal using access key "${client.accessKey}" to access all files.\n\nRegards,\nDasari Bharadwaj`;

    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from Frame by DB`,
      text: emailText,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          path: pdfPath
        }
      ]
    });

    // Update history
    invoice.history.push({
      action: 'Invoice Sent',
      date: new Date(),
      notes: `Emailed to ${client.email}`
    });
    await invoice.save();

    return res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Admin: Delete Invoice
async function deleteInvoice(req, res) {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Try deleting file
    try {
      const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
      const dirPath = isVercel ? '/tmp/invoices' : path.join(process.cwd(), 'public', 'invoices');
      const filePath = path.join(dirPath, `${invoice.invoiceNumber}.pdf`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
      console.warn('Could not delete PDF file from disk:', e);
    }

    return res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Get Invoices List
async function getClientInvoices(req, res) {
  try {
    const invoices = await Invoice.find({ clientId: req.user.id }).sort({ createdAt: -1 });
    const mapped = invoices.map(inv => ({
      ...inv.toObject(),
      id: inv._id.toString()
    }));
    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Get Single Invoice
async function getClientInvoiceById(req, res) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }
    if (invoice.clientId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Access denied' });
    }
    return res.json({
      ...invoice.toObject(),
      id: invoice._id.toString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Client Portal: Simulate UPI Payment
async function clientPayInvoice(req, res) {
  try {
    const { invoiceId, amount, paymentMethod, transactionId } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ success: false, error: 'Invoice ID and amount are required' });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const payAmount = Number(amount);
    const newPaid = invoice.paidAmount + payAmount;
    const newBalance = Math.max(0, invoice.total - newPaid);
    const status = newBalance === 0 ? 'Paid' : 'Sent';

    // Update invoice
    invoice.paidAmount = newPaid;
    invoice.balanceAmount = newBalance;
    invoice.status = status;
    invoice.history.push({
      action: 'Payment Received',
      date: new Date(),
      notes: `Cleared amount ₹${payAmount.toLocaleString('en-IN')} via ${paymentMethod || 'UPI'}`
    });
    await invoice.save();

    // Create payment transaction log
    const paymentLog = new Payment({
      invoiceId: invoice._id,
      amount: payAmount,
      paymentMethod: paymentMethod || 'UPI / QR Scan',
      transactionId: transactionId || `TXN_UPI_${Date.now()}`,
      paymentDate: new Date(),
      status: 'Success'
    });
    await paymentLog.save();

    // Update booking payment status if linked
    if (invoice.bookingId) {
      const booking = await Booking.findById(invoice.bookingId);
      if (booking) {
        booking.paymentStatus = newBalance === 0 ? 'paid' : 'partial';
        await booking.save();
      }
    }

    // Re-generate PDF
    const client = await Client.findById(invoice.clientId);
    const settings = await Setting.findOne() || {};
    const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
    await generateInvoicePDF(invoice, client, invoice.items, booking, settings);

    return res.json({ success: true, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Public: Get Invoice Data (for dynamic PDF generation in Next.js)
async function getPublicInvoiceData(req, res) {
  try {
    const { invoiceNumber } = req.params;
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const client = await Client.findById(invoice.clientId);
    const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
    const settings = await Setting.findOne() || {};

    return res.json({
      success: true,
      invoice: {
        ...invoice.toObject(),
        id: invoice._id.toString()
      },
      client: client ? {
        ...client.toObject(),
        id: client._id.toString()
      } : null,
      booking: booking ? {
        ...booking.toObject(),
        id: booking._id.toString()
      } : null,
      settings
    });
  } catch (error) {
    console.error('Public invoice fetch error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getInvoices,
  createInvoice,
  duplicateInvoice,
  sendInvoice,
  deleteInvoice,
  getClientInvoices,
  getClientInvoiceById,
  clientPayInvoice,
  getPublicInvoiceData
};
