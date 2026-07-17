import { NextResponse } from 'next/server';
import { updateBookingStatus, deleteBooking } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const { status } = body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const updated = await updateBookingStatus(id, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await deleteBooking(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
