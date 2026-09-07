import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, PaymentModel, ClientModel, Setting, Booking } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;
    await connectToDatabase();

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    if (payment.status === 'Approved' || payment.status === 'Success') {
      return NextResponse.json({ success: false, error: 'Payment has already been approved' }, { status: 400 });
    }

    const invoice = await Invoice.findById(payment.invoiceId);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Associated invoice not found' }, { status: 404 });
    }

    // Update payment status
    payment.status = 'Approved';
    await payment.save();

    // Recalculate invoice balances
    invoice.paidAmount = (invoice.paidAmount || 0) + Number(payment.amount);
    invoice.balanceAmount = Math.max(0, invoice.total - invoice.paidAmount);
    invoice.paymentStatus = computeInvoicePaymentStatus(invoice);
    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    } else {
      invoice.status = 'Partially Paid';
    }

    invoice.history.push({
      action: 'Payment Approved',
      date: new Date(),
      notes: `Admin approved payment confirmation of ₹${payment.amount.toLocaleString('en-IN')} (${payment.paymentMethod || payment.method} - Txn: ${payment.transactionId})`
    });

    const updatedInvoice = await invoice.save();

    // Regenerate invoice PDF
    try {
      const client = await ClientModel.findById(invoice.clientId);
      const settings = (await Setting.findOne()) || {};
      const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
      await generateInvoicePDF(updatedInvoice, client, updatedInvoice.items || [], booking, settings);
    } catch (pdfErr) {
      console.warn('Could not regenerate invoice PDF after payment approval:', pdfErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment approved successfully',
      payment: {
        ...payment.toObject(),
        id: payment._id.toString()
      },
      invoice: {
        ...updatedInvoice.toObject(),
        id: updatedInvoice._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Payment approval error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
