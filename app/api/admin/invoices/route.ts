import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { 
  readDB, 
  addInvoice, 
  getClients, 
  addClient, 
  updateClient, 
  getSettings, 
  getBookings,
  addInvoiceHistory 
} from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/pdf';
import { sendEmail } from '@/lib/email';
import React from 'react';
import InvoiceNotification from '@/emails/InvoiceNotification';

export async function GET() {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await readDB();
    const invoicesWithClients = db.invoices.map((inv) => {
      const client = db.clients.find((c) => c.id === inv.clientId);
      return {
        ...inv,
        clientName: client ? client.name : 'Unknown Client',
        clientEmail: client ? client.email : '',
      };
    });

    return NextResponse.json(invoicesWithClients);
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
    const {
      invoiceNumber,
      bookingId,
      clientId,
      issueDate,
      dueDate,
      discount,
      tax,
      paidAmount,
      notes,
      items, // array of items { serviceName, description, quantity, price, tax, total }
    } = body;

    const db = await readDB();
    let finalClientId = clientId;

    // 1. If no clientId is selected but bookingId is provided, resolve/create Client
    if (bookingId && !finalClientId) {
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (booking) {
        const client = db.clients.find(
          (c) => c.email.trim().toLowerCase() === booking.email.trim().toLowerCase()
        );
        
        if (!client) {
          // Generate a clean access key based on client first name and current year
          const firstName = booking.name.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '');
          const accessKey = `${firstName}-${new Date().getFullYear()}`;
          const newClient = await addClient({
            name: booking.name,
            email: booking.email,
            phone: booking.phone,
            accessKey,
            billingAddress: booking.location,
            downloads: [],
            albumPhotos: [],
          });
          finalClientId = newClient.id;
        } else {
          finalClientId = client.id;
        }
      }
    }

    if (!finalClientId) {
      return NextResponse.json({ error: 'A valid client or booking is required to generate an invoice' }, { status: 400 });
    }

    // 2. Save invoice to database
    const result = await addInvoice(
      {
        invoiceNumber,
        bookingId,
        clientId: finalClientId,
        issueDate,
        dueDate,
        discount: Number(discount || 0),
        tax: Number(tax || 0),
        paidAmount: Number(paidAmount || 0),
        notes,
      },
      items
    );

    // Reload client and invoice data
    const client = db.clients.find((c) => c.id === finalClientId) || await readDB().then(d => d.clients.find(c => c.id === finalClientId));
    if (!client) {
      return NextResponse.json({ error: 'Client account not found' }, { status: 404 });
    }
    const settings = await getSettings();
    const booking = db.bookings.find((b) => b.id === bookingId);

    // 3. Generate PDF
    console.log(`Generating PDF for Invoice: ${result.invoiceNumber}`);
    const pdfBuffer = await generateInvoicePDF(
      result,
      client,
      result.items,
      booking,
      settings
    );

    // 4. Attach PDF to client account downloads
    const pdfLink = `/invoices/${result.invoiceNumber}.pdf`;
    const downloadItem = {
      label: `Invoice ${result.invoiceNumber} (PDF)`,
      size: `${Math.round(pdfBuffer.length / 1024)} KB`,
      url: pdfLink,
    };
    
    const currentDownloads = client.downloads || [];
    if (!currentDownloads.some((dl: any) => dl.url === pdfLink)) {
      await updateClient(finalClientId, {
        downloads: [...currentDownloads, downloadItem],
      });
    }

    // 5. Email PDF to client
    console.log(`Sending email to: ${client.email}`);
    const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${result.invoiceNumber} from Frame by DB.\n\nTotal: ₹${result.total.toLocaleString('en-IN')}\nDue Date: ${result.dueDate}\n\nLog in to the Client Portal using access key "${client.accessKey}" to access all files.\n\nRegards,\nDasari Bharadwaj`;
    
    await sendEmail({
      to: client.email,
      subject: `Invoice ${result.invoiceNumber} from Frame by DB`,
      template: React.createElement(InvoiceNotification, {
        clientName: client.name,
        invoiceNumber: result.invoiceNumber,
        totalAmount: result.total,
        dueDate: result.dueDate,
      }),
      text: emailText,
      attachments: [
        {
          filename: `${result.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    // 6. Log history
    await addInvoiceHistory(result.id, 'Invoice Generated & PDF Compiled', 'Automated trigger');
    await addInvoiceHistory(result.id, 'Emailed PDF to Client', `Sent to ${client.email}`);

    return NextResponse.json({ success: true, invoice: result });
  } catch (error: any) {
    console.error('Invoice creation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
