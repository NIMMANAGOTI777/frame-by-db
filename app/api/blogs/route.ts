import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Blog } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    const blogs = await Blog.find().sort({ createdAt: -1 });
    const mapped = blogs.map(item => ({
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
    const blog = new Blog(body);
    const saved = await blog.save();
    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
