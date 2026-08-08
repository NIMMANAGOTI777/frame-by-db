import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Portfolio } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const item = await Portfolio.findByIdAndDelete(id);
    if (!item) {
      return NextResponse.json({ success: false, error: 'Portfolio item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Portfolio item deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
