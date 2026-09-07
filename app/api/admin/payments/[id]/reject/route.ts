import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, PaymentModel } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

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

    const body = await request.json().catch(() => ({}));
    const { reason = 'Payment details could not be verified' } = body;

    const payment = await PaymentModel.findById(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: 'Payment record not found' }, { status: 404 });
    }

    payment.status = 'Rejected';
    payment.rejectionReason = reason;
    await payment.save();

    // Leave invoice balance unchanged, but record rejection in invoice history
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      invoice.history.push({
        action: 'Payment Rejected',
        date: new Date(),
        notes: `Admin rejected payment confirmation of ₹${payment.amount.toLocaleString('en-IN')}. Reason: ${reason}`
      });
      await invoice.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmation rejected',
      payment: {
        ...payment.toObject(),
        id: payment._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Payment rejection error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
