import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Setting, Booking } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';
import { sendEmail } from '@/lib/utils/sendEmail';
import path from 'path';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const invoice = await Invoice.findById(id).populate('clientId');
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const client = invoice.clientId;
    if (!client || !client.email) {
      return NextResponse.json({ success: false, error: 'Client email is missing' }, { status: 400 });
    }

    let bodyTheme: string | null = null;
    try {
      const body = await request.json();
      if (body && body.theme) {
        bodyTheme = body.theme;
      }
    } catch {}

    const settings = (await Setting.findOne()) || {};
    const booking = invoice.bookingId ? await Booking.findById(invoice.bookingId) : null;
    const activeTheme = bodyTheme || invoice.invoiceTheme || 'purple';
    if (bodyTheme && bodyTheme !== invoice.invoiceTheme) {
      invoice.invoiceTheme = bodyTheme;
    }
    const pdfBuffer = await generateInvoicePDF(invoice, client, invoice.items, booking, settings, activeTheme);

    const emailText = `Hi ${client.name},\n\nPlease find attached invoice ${invoice.invoiceNumber} from Frame by DB.\n\nTotal Amount: ₹${invoice.total.toLocaleString('en-IN')}\nBalance Due: ₹${invoice.balanceAmount.toLocaleString('en-IN')}\nDue Date: ${invoice.dueDate.toISOString().split('T')[0]}\n\nLog in to your Client Portal using key "${client.accessKey}".\n\nRegards,\nDasari Bharadwaj`;
    const attachmentFilename = `${invoice.invoiceNumber}-${activeTheme}.pdf`;

    await sendEmail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from Frame by DB`,
      text: emailText,
      attachments: [
        {
          filename: attachmentFilename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    invoice.status = 'Sent';
    invoice.history.push({
      action: 'Invoice Sent',
      date: new Date(),
      notes: `Emailed to ${client.email}`
    });
    await invoice.save();

    return NextResponse.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
