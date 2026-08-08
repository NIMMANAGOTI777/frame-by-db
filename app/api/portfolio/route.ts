import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Portfolio } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const items = await Portfolio.find().sort({ createdAt: -1 });
    const mapped = items.map(item => ({
      ...item.toObject(),
      id: item._id.toString()
    }));
    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const item = new Portfolio(body);
    const saved = await item.save();
    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
