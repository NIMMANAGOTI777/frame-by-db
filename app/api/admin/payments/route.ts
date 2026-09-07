import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, PaymentModel, ClientModel, Setting, Booking } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    const status = searchParams.get('status');

    const filter: any = {};
    if (invoiceId) {
      filter.invoiceId = invoiceId;
    }
    if (status) {
      filter.status = status;
    }

    const payments = await PaymentModel.find(filter)
      .populate('invoiceId')
      .populate('clientId')
      .sort({ createdAt: -1 });

    const mapped = payments.map(pm => {
      const obj = pm.toObject();
      return {
        ...obj,
        id: pm._id.toString(),
        invoiceId: pm.invoiceId ? {
          ...pm.invoiceId.toObject(),
          id: pm.invoiceId._id.toString()
        } : null,
        clientId: pm.clientId ? {
          ...pm.clientId.toObject(),
          id: pm.clientId._id.toString()
        } : null
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const {
      invoiceId,
      amount,
      paymentMethod = 'UPI',
      method,
      transactionId,
      paymentDate,
      notes
    } = body;

    const chosenMethod = method || paymentMethod || 'UPI';

    if (!invoiceId || !amount) {
      return NextResponse.json({ success: false, error: 'Invoice ID and amount are required' }, { status: 400 });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid payment amount is required' }, { status: 400 });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const payment = new PaymentModel({
      invoiceId: invoice._id,
      clientId: invoice.clientId,
      amount: numericAmount,
      paymentMethod: chosenMethod,
      method: chosenMethod,
      transactionId: transactionId || `TXN-ADM-${Date.now()}`,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      status: 'Success',
      notes: notes || 'Recorded by admin'
    });

    const savedPayment = await payment.save();

    // Update invoice paid & balance amounts
    invoice.paidAmount = (invoice.paidAmount || 0) + numericAmount;
    invoice.balanceAmount = Math.max(0, invoice.total - invoice.paidAmount);
    invoice.paymentStatus = computeInvoicePaymentStatus(invoice);
    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    } else if (invoice.status === 'Draft' || invoice.status === 'Pending') {
      invoice.status = 'Partially Paid';
    }

    invoice.history.push({
      action: 'Payment Recorded by Admin',
      date: new Date(),
      notes: `Recorded ₹${numericAmount.toLocaleString('en-IN')} via ${chosenMethod} (${savedPayment.transactionId})`
    });

    const updatedInvoice = await invoice.save();

    // Regenerate invoice PDF with new payment balance
    try {
      const client = await ClientModel.findById(invoice.clientId);
      const settings = (await Setting.findOne()) || {};
      const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
      await generateInvoicePDF(updatedInvoice, client, updatedInvoice.items || [], booking, settings);
    } catch (pdfErr) {
      console.warn('Could not regenerate invoice PDF after payment record:', pdfErr);
    }

    return NextResponse.json({
      success: true,
      payment: {
        ...savedPayment.toObject(),
        id: savedPayment._id.toString()
      },
      invoice: {
        ...updatedInvoice.toObject(),
        id: updatedInvoice._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Admin payment creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
