import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, PaymentModel, ClientModel, Setting, Booking } from '@/lib/models';
import { verifyClient } from '@/lib/auth';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find({ clientId: clientUser.id });
    const invoiceIds = invoices.map(inv => inv._id);

    const payments = await PaymentModel.find({
      $or: [
        { clientId: clientUser.id },
        { invoiceId: { $in: invoiceIds } }
      ]
    }).sort({ createdAt: -1 });

    const mapped = payments.map(pm => ({
      ...pm.toObject(),
      id: pm._id.toString(),
      invoiceId: pm.invoiceId?.toString(),
      clientId: pm.clientId?.toString()
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      invoiceId,
      amount,
      paymentMethod = 'UPI',
      method,
      transactionId,
      paymentDate,
      screenshotUrl,
      notes,
      isConfirmation = false
    } = body;

    const chosenMethod = method || paymentMethod || 'UPI';

    if (!invoiceId || !amount) {
      return NextResponse.json({ success: false, error: 'Invoice ID and payment amount are required' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid payment amount is required' }, { status: 400 });
    }

    await connectToDatabase();
    const invoice = await Invoice.findOne({ _id: invoiceId, clientId: clientUser.id });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Determine if this is a submitted payment confirmation requiring admin approval
    // (e.g. Bank Transfer / UPI confirmation submission) vs instant online simulation
    const requiresApproval = isConfirmation || chosenMethod === 'Bank Transfer' || !!screenshotUrl;

    const payment = new PaymentModel({
      invoiceId: invoice._id,
      clientId: clientUser.id,
      amount: numericAmount,
      paymentMethod: chosenMethod,
      method: chosenMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: requiresApproval ? 'Pending' : 'Success',
      screenshotUrl: screenshotUrl || '',
      notes: notes || (requiresApproval ? 'Submitted by client for verification' : 'Instant payment recorded')
    });

    const savedPayment = await payment.save();

    if (requiresApproval) {
      // Payment confirmation submitted: add record to invoice history but keep balance pending
      invoice.history.push({
        action: 'Payment Confirmation Submitted',
        date: new Date(),
        notes: `Client submitted confirmation for ₹${numericAmount.toLocaleString('en-IN')} via ${chosenMethod} (Txn: ${savedPayment.transactionId}). Awaiting admin verification.`
      });
      await invoice.save();

      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Payment confirmation submitted successfully. Our team will verify and update your balance.',
        payment: {
          ...savedPayment.toObject(),
          id: savedPayment._id.toString(),
          invoiceId: savedPayment.invoiceId.toString()
        },
        invoice: {
          ...invoice.toObject(),
          id: invoice._id.toString()
        }
      });
    }

    // Direct / Online payment flow: update invoice amounts immediately
    invoice.paidAmount = (invoice.paidAmount || 0) + numericAmount;
    invoice.balanceAmount = Math.max(0, invoice.total - invoice.paidAmount);
    invoice.paymentStatus = computeInvoicePaymentStatus(invoice);
    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    }

    invoice.history.push({
      action: 'Payment Received',
      date: new Date(),
      notes: `Received ₹${numericAmount.toLocaleString('en-IN')} via ${chosenMethod} (${savedPayment.transactionId})`
    });

    const updatedInvoice = await invoice.save();

    // Regenerate invoice PDF with updated balance and saved theme
    try {
      const clientObj = await ClientModel.findById(invoice.clientId);
      const settings = (await Setting.findOne()) || {};
      const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
      await generateInvoicePDF(updatedInvoice, clientObj, updatedInvoice.items || [], booking, settings, updatedInvoice.invoiceTheme || 'purple');
    } catch (pdfErr) {
      console.warn('Could not regenerate invoice PDF after client payment:', pdfErr);
    }

    return NextResponse.json({
      success: true,
      pendingApproval: false,
      message: 'Payment recorded successfully.',
      payment: {
        ...savedPayment.toObject(),
        id: savedPayment._id.toString(),
        invoiceId: savedPayment.invoiceId.toString()
      },
      invoice: {
        ...updatedInvoice.toObject(),
        id: updatedInvoice._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Client payment error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
