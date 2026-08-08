import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { verifyClient } from '@/lib/auth';

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

    return NextResponse.json({
      ...invoice.toObject(),
      id: invoice._id.toString(),
      clientId: invoice.clientId.toString(),
      bookingId: invoice.bookingId ? invoice.bookingId.toString() : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
