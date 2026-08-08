import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Admin, User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyAdmin, signAdminToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    // Look up in Admin table first
    let account = await Admin.findOne({ username });
    if (!account) {
      account = await User.findOne({ username });
    }

    if (!account) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const payload = {
      id: account._id.toString(),
      username: account.username,
      role: 'admin' as const
    };

    const token = signAdminToken(payload);

    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 1 day in seconds
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: { username: account.username, role: 'admin' },
      token
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const adminUser = await verifyAdmin(request);
  if (!adminUser) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Access token missing' }, { status: 401 });
  }
  return NextResponse.json({ isLoggedIn: true, user: adminUser });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
