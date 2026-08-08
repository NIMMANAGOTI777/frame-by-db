import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { ClientModel } from '@/lib/models';
import { cookies } from 'next/headers';
import { verifyClient, signClientToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const { accessKey } = await request.json();

    if (!accessKey) {
      return NextResponse.json({ success: false, error: 'Access key is required' }, { status: 400 });
    }

    const client = await ClientModel.findOne({ accessKey });
    if (!client) {
      return NextResponse.json({ success: false, error: 'Invalid access key' }, { status: 401 });
    }

    const payload = {
      id: client._id.toString(),
      name: client.name,
      email: client.email,
      role: 'client' as const
    };

    const token = signClientToken(payload);

    const cookieStore = await cookies();
    cookieStore.set('client_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/'
    });

    return NextResponse.json({
      success: true,
      client: { id: client._id, name: client.name, email: client.email },
      token
    });
  } catch (error: any) {
    console.error('Client login error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ isLoggedIn: false });
    }

    await connectToDatabase();
    const client = await ClientModel.findById(clientUser.id);
    if (!client) {
      return NextResponse.json({ isLoggedIn: false });
    }

    return NextResponse.json({
      isLoggedIn: true,
      client: {
        id: client._id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        companyName: client.companyName,
        billingAddress: client.billingAddress
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('client_token');
  return NextResponse.json({ success: true });
}
