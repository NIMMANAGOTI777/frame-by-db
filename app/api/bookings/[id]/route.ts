import { NextResponse } from 'next/server';
import { updateBooking, deleteBooking } from '@/lib/db';
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
    
    if (body.status) {
      const validStatuses = [
        'New', 'Pending', 'Confirmed', 'Quotation Sent', 'Advance Paid',
        'Shoot Scheduled', 'Shoot Completed', 'Editing', 'Gallery Ready',
        'Delivered', 'Cancelled'
      ];
      const matchedStatus = validStatuses.find(s => s.toLowerCase() === body.status.toLowerCase());
      if (!matchedStatus) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      body.status = matchedStatus;
    }
    
    const updated = await updateBooking(id, body);
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
