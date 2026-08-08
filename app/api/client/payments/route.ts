import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, PaymentModel } from '@/lib/models';
import { verifyClient } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find({ clientId: clientUser.id });
    const invoiceIds = invoices.map(inv => inv._id);

    const payments = await PaymentModel.find({ invoiceId: { $in: invoiceIds } }).sort({ createdAt: -1 });

    const mapped = payments.map(pm => ({
      ...pm.toObject(),
      id: pm._id.toString(),
      invoiceId: pm.invoiceId.toString()
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

    const { invoiceId, amount, paymentMethod, transactionId } = await request.json();
    if (!invoiceId || !amount || !paymentMethod) {
      return NextResponse.json({ success: false, error: 'Invoice ID, amount, and payment method are required' }, { status: 400 });
    }

    await connectToDatabase();
    const invoice = await Invoice.findOne({ _id: invoiceId, clientId: clientUser.id });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const payment = new PaymentModel({
      invoiceId: invoice._id,
      amount: Number(amount),
      paymentMethod,
      transactionId: transactionId || `TXN-${Date.now()}`,
      status: 'Success'
    });

    const savedPayment = await payment.save();

    // Update invoice paid & balance amounts
    invoice.paidAmount = (invoice.paidAmount || 0) + Number(amount);
    invoice.balanceAmount = Math.max(0, invoice.total - invoice.paidAmount);
    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    }

    invoice.history.push({
      action: 'Payment Received',
      date: new Date(),
      notes: `Received ₹${amount} via ${paymentMethod} (${transactionId || 'No Txn ID'})`
    });

    await invoice.save();

    return NextResponse.json({
      success: true,
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
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
