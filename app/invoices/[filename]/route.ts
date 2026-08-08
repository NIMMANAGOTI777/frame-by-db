import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, Setting, Booking } from '@/lib/models';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';

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

    // 3. Dynamic Regeneration directly from MongoDB Atlas
    const invoiceNumber = filename.substring(0, filename.length - 4);
    await connectToDatabase();

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate('clientId')
      .populate('bookingId');

    if (!invoice || !invoice.clientId) {
      return new Response('Invoice not found in database', { status: 404 });
    }

    const settings = (await Setting.findOne()) || {};
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      invoice.clientId,
      invoice.items || [],
      invoice.bookingId,
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
