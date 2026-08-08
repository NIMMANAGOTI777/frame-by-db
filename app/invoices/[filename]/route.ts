import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

    // 3. Dynamic Regeneration: Fetch from Express backend public invoice endpoint
    const invoiceNumber = filename.substring(0, filename.length - 4);
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://frame-by-db-api.onrender.com/api';
    
    console.log(`Requesting public invoice data for PDF compilation: ${invoiceNumber}`);
    const res = await fetch(`${apiBase}/invoices/public/${invoiceNumber}`, { cache: 'no-store' });
    if (!res.ok) {
      return new Response('Invoice not found in database', { status: 404 });
    }

    const data = await res.json();
    if (!data.success || !data.invoice) {
      return new Response('Invoice data is invalid', { status: 404 });
    }

    const { invoice, client, booking, settings } = data;

    console.log(`Regenerating PDF dynamically on-the-fly for: ${invoiceNumber}`);
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      client,
      invoice.items || [],
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
