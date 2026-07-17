import { NextResponse } from 'next/server';
import { getBlogs, addBlog } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const blogs = await getBlogs();
    return NextResponse.json(blogs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const newBlog = await addBlog(body);
    return NextResponse.json(newBlog, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
