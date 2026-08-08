import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Booking, Setting } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const invoice = await Invoice.findById(id)
      .populate('clientId')
      .populate('bookingId');

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const updates = await request.json();

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (updates.items) {
      invoice.items = updates.items;
      invoice.subtotal = updates.items.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    }

    if (updates.tax !== undefined) invoice.tax = Number(updates.tax);
    if (updates.discount !== undefined) invoice.discount = Number(updates.discount);
    if (updates.paidAmount !== undefined) invoice.paidAmount = Number(updates.paidAmount);
    if (updates.status) invoice.status = updates.status;
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.issueDate) invoice.issueDate = new Date(updates.issueDate);
    if (updates.dueDate) invoice.dueDate = new Date(updates.dueDate);

    invoice.total = invoice.subtotal + Number(invoice.tax || 0) - Number(invoice.discount || 0);
    invoice.balanceAmount = Math.max(0, invoice.total - Number(invoice.paidAmount || 0));

    if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    }

    invoice.history.push({
      action: 'Invoice Updated',
      date: new Date(),
      notes: updates.notes || 'Updated by admin'
    });

    const saved = await invoice.save();

    const client = await ClientModel.findById(saved.clientId);
    const settings = (await Setting.findOne()) || {};
    const booking = saved.bookingId ? await Booking.findById(saved.bookingId) : null;
    await generateInvoicePDF(saved, client, saved.items, booking, settings);

    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
