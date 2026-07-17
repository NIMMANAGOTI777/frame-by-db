import { NextResponse } from 'next/server';
import { deleteGalleryItem } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await deleteGalleryItem(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
