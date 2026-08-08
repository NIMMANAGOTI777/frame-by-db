import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      clientId: booking.clientId ? booking.clientId.toString() : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function updateBookingHandler(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const updates = await request.json();

    if (updates.date) updates.date = new Date(updates.date);
    if (updates.budget !== undefined && updates.budget !== null && updates.budget !== '') {
      updates.budget = typeof updates.budget === 'number' ? updates.budget : parseFloat(String(updates.budget).replace(/[^0-9.]/g, ''));
    }

    delete updates._id;
    delete updates.id;
    delete updates.bookingId;
    delete updates.clientId;
    delete updates.createdAt;
    delete updates.updatedAt;

    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...booking.toObject(),
      id: booking._id.toString(),
      clientId: booking.clientId ? booking.clientId.toString() : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export { updateBookingHandler as PATCH, updateBookingHandler as PUT };

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Booking deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
