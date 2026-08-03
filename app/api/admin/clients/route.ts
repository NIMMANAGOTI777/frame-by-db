import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getClients, addClient } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await getClients();
    return NextResponse.json(clients);
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
    const { name, email, phone, companyName, billingAddress, accessKey } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
    }

    const newClient = await addClient({
      name,
      email,
      phone: phone || '',
      companyName: companyName || '',
      billingAddress: billingAddress || '',
      accessKey: accessKey || undefined
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
