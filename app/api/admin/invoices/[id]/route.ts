import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  getInvoiceById, 
  updateInvoice, 
  deleteInvoice, 
  addInvoiceHistory,
  getClientById,
  getSettings,
  getBookings,
  readDB
} from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const invoice = await getInvoiceById(id);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const body = await request.json();
    const { items, ...fields } = body;

    const oldInvoice = await getInvoiceById(id);
    if (!oldInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 1. Update invoice and items
    const updated = await updateInvoice(id, fields, items);

    // 2. Fetch full updated details to regenerate PDF
    const fullUpdatedInvoice = await getInvoiceById(id);
    if (!fullUpdatedInvoice) {
      return NextResponse.json({ error: 'Updated invoice not found' }, { status: 404 });
    }
    const client = await getClientById(fullUpdatedInvoice.clientId);
    if (!client) {
      return NextResponse.json({ error: 'Associated client not found' }, { status: 404 });
    }
    const settings = await getSettings();
    const bookings = await getBookings();
    const booking = bookings.find((b: any) => b.id === fullUpdatedInvoice.bookingId);

    // 3. Regenerate PDF so it's always matching current data
    await generateInvoicePDF(
      fullUpdatedInvoice,
      client,
      fullUpdatedInvoice.items,
      booking,
      settings
    );

    // 4. Log history
    let changeLog = 'Invoice updated';
    if (fields.status && fields.status !== oldInvoice.status) {
      changeLog += `, status changed from ${oldInvoice.status} to ${fields.status}`;
    }
    if (fields.paidAmount !== undefined && fields.paidAmount !== oldInvoice.paidAmount) {
      changeLog += `, paid amount updated to ₹${fields.paidAmount}`;
    }
    
    await addInvoiceHistory(id, 'Invoice Modified', changeLog);

    return NextResponse.json({ success: true, invoice: fullUpdatedInvoice });
  } catch (error: any) {
    console.error('Invoice edit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const { id } = params;
    const deleted = await deleteInvoice(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
