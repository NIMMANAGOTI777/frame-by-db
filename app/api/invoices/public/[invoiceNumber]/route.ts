import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Setting, Booking } from '@/lib/models';

export async function GET(request: Request, { params }: { params: Promise<{ invoiceNumber: string }> }) {
  try {
    const { invoiceNumber } = await params;
    await connectToDatabase();

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('clientId')
      .populate('bookingId');

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const settings = (await Setting.findOne()) || {};

    return NextResponse.json({
      success: true,
      invoice: {
        ...invoice.toObject(),
        id: invoice._id.toString(),
        clientId: invoice.clientId ? {
          ...invoice.clientId.toObject(),
          id: invoice.clientId._id.toString()
        } : null,
        bookingId: invoice.bookingId ? {
          ...invoice.bookingId.toObject(),
          id: invoice.bookingId._id.toString()
        } : null
      },
      settings
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
