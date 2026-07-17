import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await readDB();
    
    const user = db.users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      const response = NextResponse.json({
        success: true,
        user: { username: user.username, role: user.role }
      });
      
      // Set simple secure session cookie
      response.cookies.set('admin_session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      
      return response;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  return response;
}
export async function GET(request: Request) {
  // Simple check endpoint
  const cookieHeader = request.headers.get('cookie') || '';
  const isLoggedIn = cookieHeader.includes('admin_session=true');
  return NextResponse.json({ isLoggedIn });
}
