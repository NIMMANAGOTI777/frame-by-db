import { NextResponse } from 'next/server';
import { getInvoicesByClientId } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('client_session');
    if (!session || !session.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = session.value;
    const invoices = await getInvoicesByClientId(clientId);
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
