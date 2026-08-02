import { NextResponse } from 'next/server';
import { getClientByAccessKey, getClientById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { accessKey } = await request.json();
    if (!accessKey) {
      return NextResponse.json({ error: 'Access key is required' }, { status: 400 });
    }

    const client = await getClientByAccessKey(accessKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      client: { id: client.id, name: client.name, email: client.email }
    });

    const cookieStore = await cookies();
    cookieStore.set('client_session', client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('client_session');
    if (!session || !session.value) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const client = await getClientById(session.value);
    if (!client) {
      return NextResponse.json({ isLoggedIn: false });
    }

    return NextResponse.json({ isLoggedIn: true, client });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  cookieStore.delete('client_session');
  return response;
}
