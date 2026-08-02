import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readDB, getSettings } from '@/lib/db';
import { generateInvoicePDF } from '@/lib/pdf';

export async function GET(
  request: Request,
  props: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await props.params;
    const { filename } = params;

    if (!filename.toLowerCase().endsWith('.pdf')) {
      return new Response('Not Found', { status: 404 });
    }

    const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
    const vercelFilePath = path.join('/tmp/invoices', filename);
    const localFilePath = path.join(process.cwd(), 'public', 'invoices', filename);

    // 1. Try to serve from Vercel /tmp directory
    if (isVercel && fs.existsSync(vercelFilePath)) {
      const fileBuffer = await fs.promises.readFile(vercelFilePath);
      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    // 2. Try to serve from local public directory
    if (fs.existsSync(localFilePath)) {
      const fileBuffer = await fs.promises.readFile(localFilePath);
      return new Response(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    // 3. Dynamic Regeneration: Recreate PDF on-the-fly from DB records if missing from temp folder
    const invoiceNumber = filename.substring(0, filename.length - 4);
    const db = await readDB();
    const invoice = db.invoices.find(i => i.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return new Response('Invoice not found in database', { status: 404 });
    }

    const client = db.clients.find(c => c.id === invoice.clientId);
    if (!client) {
      return new Response('Client profile not found', { status: 404 });
    }

    const settings = await getSettings();
    const booking = db.bookings.find(b => b.id === invoice.bookingId);

    console.log(`Regenerating PDF dynamically on-the-fly for: ${invoiceNumber}`);
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      client,
      (invoice as any).items || [],
      booking,
      settings
    );

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Dynamic PDF server error:', error);
    return new Response(`Failed to serve PDF: ${error.message}`, { status: 500 });
  }
}
