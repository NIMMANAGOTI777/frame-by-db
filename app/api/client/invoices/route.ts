import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { verifyClient } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find({ clientId: clientUser.id }).sort({ createdAt: -1 });

    const mapped = invoices.map(inv => ({
      ...inv.toObject(),
      id: inv._id.toString(),
      clientId: inv.clientId.toString(),
      bookingId: inv.bookingId ? inv.bookingId.toString() : null
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
