import { NextResponse } from 'next/server';
import { 
  getInvoiceById, 
  getClientById, 
  getSettings, 
  getBookings, 
  addInvoiceHistory 
} from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf';
import { sendEmail } from '@/lib/email';
import React from 'react';
import InvoiceNotification from '@/emails/InvoiceNotification';

export async function POST(
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

    const client = await getClientById(invoice.clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const settings = await getSettings();
    const bookings = await getBookings();
    const booking = bookings.find((b) => b.id === invoice.bookingId);

    // Compile PDF
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      client,
      invoice.items,
      booking,
      settings
    );

    // Send email
    const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber}.\n\nRegards,\nDasari Bharadwaj`;
    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from Frame by DB`,
      template: React.createElement(InvoiceNotification, {
        clientName: client.name,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.total,
        dueDate: invoice.dueDate,
      }),
      text: emailText,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await addInvoiceHistory(invoice.id, 'Invoice Manually Re-sent', `Emailed to ${client.email}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
