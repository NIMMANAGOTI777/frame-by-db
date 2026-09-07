import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { verifyClient } from '@/lib/auth';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find({ clientId: clientUser.id }).sort({ createdAt: -1 });

    const mapped = invoices.map(inv => {
      const obj = inv.toObject();
      return {
        ...obj,
        id: inv._id.toString(),
        paidAmount: obj.paidAmount || 0,
        balanceAmount: obj.balanceAmount !== undefined ? obj.balanceAmount : Math.max(0, (obj.total || 0) - (obj.paidAmount || 0)),
        paymentStatus: obj.paymentStatus || computeInvoicePaymentStatus(obj),
        clientId: inv.clientId.toString(),
        bookingId: inv.bookingId ? inv.bookingId.toString() : null
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
