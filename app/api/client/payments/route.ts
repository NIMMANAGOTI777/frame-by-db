import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { readDB, addPayment, getInvoiceById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('client_session');
    if (!session || !session.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = session.value;
    const db = await readDB();
    const clientInvoices = db.invoices.filter((inv) => inv.clientId === clientId);
    const invoiceIds = clientInvoices.map((inv) => inv.id);
    const payments = db.payments.filter((pm) => invoiceIds.includes(pm.invoiceId));

    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('client_session');
    if (!session || !session.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = session.value;
    const body = await request.json();
    const { invoiceId, amount, paymentMethod, transactionId } = body;

    if (!invoiceId || !amount) {
      return NextResponse.json({ error: 'Invoice ID and Amount are required' }, { status: 400 });
    }

    // Verify invoice belongs to client
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.clientId !== clientId) {
      return NextResponse.json({ error: 'Forbidden: Access denied' }, { status: 403 });
    }

    const newPayment = await addPayment({
      invoiceId,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId || `TXN_CLIENT_${Date.now()}`,
      paymentDate: new Date().toISOString(),
      status: 'Success'
    });

    return NextResponse.json({ success: true, payment: newPayment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
