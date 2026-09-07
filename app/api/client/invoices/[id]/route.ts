import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { verifyClient } from '@/lib/auth';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const invoice = await Invoice.findOne({ _id: id, clientId: clientUser.id });
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const obj = invoice.toObject();
    return NextResponse.json({
      ...obj,
      id: invoice._id.toString(),
      paidAmount: obj.paidAmount || 0,
      balanceAmount: obj.balanceAmount !== undefined ? obj.balanceAmount : Math.max(0, (obj.total || 0) - (obj.paidAmount || 0)),
      paymentStatus: obj.paymentStatus || computeInvoicePaymentStatus(obj),
      clientId: invoice.clientId.toString(),
      bookingId: invoice.bookingId ? invoice.bookingId.toString() : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
