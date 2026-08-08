import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Booking, Setting } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils/generateInvoiceNumber';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';
import { sendEmail } from '@/lib/utils/sendEmail';
import path from 'path';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const invoices = await Invoice.find()
      .populate('clientId')
      .populate('bookingId')
      .sort({ createdAt: -1 });

    const mapped = invoices.map(inv => {
      const obj = inv.toObject();
      return {
        ...obj,
        id: inv._id.toString(),
        clientId: inv.clientId ? {
          ...inv.clientId.toObject(),
          id: inv.clientId._id.toString()
        } : null,
        bookingId: inv.bookingId ? {
          ...inv.bookingId.toObject(),
          id: inv.bookingId._id.toString()
        } : null
      };
    });

    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await request.json();
    const {
      invoiceNumber: customInvoiceNumber,
      bookingId,
      clientId,
      issueDate,
      dueDate,
      discount,
      tax,
      paidAmount,
      notes,
      items,
      manualClientName,
      manualClientEmail,
      manualClientPhone,
      manualClientAddress,
      shouldSendEmail = true
    } = body;
    let invoiceNumber = customInvoiceNumber;

    let finalClientId = clientId;

    if (!finalClientId && manualClientEmail) {
      let client = await ClientModel.findOne({ email: manualClientEmail.trim().toLowerCase() });
      if (!client) {
        client = new ClientModel({
          name: manualClientName || 'Client Name',
          email: manualClientEmail.trim().toLowerCase(),
          phone: manualClientPhone || '0000000000',
          accessKey: `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
          companyName: '',
          billingAddress: manualClientAddress || '',
          downloads: [],
          albumPhotos: []
        });
        await client.save();
      }
      finalClientId = client._id;
    }

    if (!finalClientId) {
      return NextResponse.json({ success: false, error: 'Client identification is required' }, { status: 400 });
    }

    const client = await ClientModel.findById(finalClientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client profile not found' }, { status: 404 });
    }

    const parsedItems = items || [];
    const subtotal = parsedItems.reduce((sum: number, item: any) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0);
    const total = subtotal + Number(tax || 0) - Number(discount || 0);
    const finalPaid = Number(paidAmount || 0);
    const balanceAmount = Math.max(0, total - finalPaid);
    const status = balanceAmount === 0 ? 'Paid' : 'Draft';

    if (!invoiceNumber) {
      invoiceNumber = await generateInvoiceNumber();
    }

    const history = [{
      action: 'Invoice Generated',
      date: new Date(),
      notes: 'Initial generation'
    }];

    const newInvoice = new Invoice({
      invoiceNumber,
      bookingId: bookingId || null,
      clientId: finalClientId,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      subtotal,
      tax: Number(tax || 0),
      discount: Number(discount || 0),
      total,
      paidAmount: finalPaid,
      balanceAmount,
      status,
      notes: notes || '',
      history,
      items: parsedItems
    });

    const savedInvoice = await newInvoice.save();

    let settings = await Setting.findOne();
    if (!settings) {
      settings = {};
    }

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
    }

    await generateInvoicePDF(savedInvoice, client, parsedItems, booking, settings);

    if (shouldSendEmail && client.email) {
      try {
        const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${savedInvoice.invoiceNumber} from Frame by DB.\n\nTotal: ₹${savedInvoice.total.toLocaleString('en-IN')}\nDue Date: ${savedInvoice.dueDate.toISOString().split('T')[0]}\n\nLog in to the Client Portal using access key "${client.accessKey}" to access all files.\n\nRegards,\nDasari Bharadwaj`;
        const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
        const dirPath = isVercel ? '/tmp/invoices' : path.join(process.cwd(), 'public', 'invoices');
        const pdfPath = path.join(dirPath, `${savedInvoice.invoiceNumber}.pdf`);

        await sendEmail({
          to: client.email,
          subject: `Invoice ${savedInvoice.invoiceNumber} from Frame by DB`,
          text: emailText,
          attachments: [
            {
              filename: `${savedInvoice.invoiceNumber}.pdf`,
              path: pdfPath
            }
          ]
        });
      } catch (emailErr) {
        console.error('Failed to email invoice PDF:', emailErr);
      }
    }

    return NextResponse.json({
      ...savedInvoice.toObject(),
      id: savedInvoice._id.toString()
    }, { status: 201 });
  } catch (error: any) {
    console.error('Invoice creation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
