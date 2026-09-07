import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Booking, Setting } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils/generateInvoiceNumber';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';
import { sendEmail } from '@/lib/utils/sendEmail';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';
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
      const clientObj = inv.clientId ? inv.clientId.toObject() : null;
      return {
        ...obj,
        id: inv._id.toString(),
        paidAmount: obj.paidAmount || 0,
        balanceAmount: obj.balanceAmount !== undefined ? obj.balanceAmount : Math.max(0, (obj.total || 0) - (obj.paidAmount || 0)),
        paymentStatus: obj.paymentStatus || computeInvoicePaymentStatus(obj),
        clientName: clientObj?.name || '',
        clientEmail: clientObj?.email || '',
        clientId: clientObj ? {
          ...clientObj,
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
      createdBy = 'Dasari Bharadwaj',
      billedBy,
      billedTo,
      discount,
      discountType = 'none',
      discountValue = 0,
      tax,
      cgst,
      sgst,
      paidAmount,
      status: customStatus,
      paymentMethod = 'UPI',
      paymentDate,
      transactionId = '',
      bankDetails,
      upiId,
      qrCodeUrl,
      upiNote,
      signatureUrl,
      invoiceTheme = 'purple',
      notes,
      terms,
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
    const subtotal = parsedItems.reduce((sum: number, item: any) => sum + (Number(item.price || item.rate || 0) * Number(item.quantity || 1)), 0);
    const calculatedTax = tax !== undefined ? Number(tax) : parsedItems.reduce((sum: number, item: any) => sum + Number(item.tax || (Number(item.cgst || 0) + Number(item.sgst || 0))), 0);
    const calculatedCgst = cgst !== undefined ? Number(cgst) : calculatedTax / 2;
    const calculatedSgst = sgst !== undefined ? Number(sgst) : calculatedTax / 2;
    const total = subtotal + calculatedTax - Number(discount || 0);
    const finalPaid = Number(paidAmount || 0);
    const balanceAmount = Math.max(0, total - finalPaid);
    const status = customStatus || (balanceAmount === 0 ? 'Paid' : 'Draft');

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
      createdBy: createdBy || 'Dasari Bharadwaj',
      billedBy: billedBy || null,
      billedTo: billedTo || null,
      subtotal,
      cgst: calculatedCgst,
      sgst: calculatedSgst,
      tax: calculatedTax,
      discount: Number(discount || 0),
      discountType: discountType || 'none',
      discountValue: Number(discountValue || 0),
      total,
      paidAmount: finalPaid,
      balanceAmount,
      status,
      paymentStatus: computeInvoicePaymentStatus({ total, paidAmount: finalPaid, dueDate, status }),
      paymentDate: paymentDate ? new Date(paymentDate) : null,
      paymentMethod: paymentMethod || 'UPI',
      transactionId: transactionId || '',
      bankDetails: bankDetails || null,
      upiId: upiId || 'dasaribharadwaj@ybl',
      qrCodeUrl: qrCodeUrl || undefined,
      upiNote: upiNote || undefined,
      signatureUrl: signatureUrl || '',
      invoiceTheme: invoiceTheme || 'purple',
      notes: notes || '',
      terms: terms || '',
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

    const activeTheme = savedInvoice.invoiceTheme || 'purple';
    const pdfBuffer = await generateInvoicePDF(savedInvoice, client, parsedItems, booking, settings, activeTheme);

    if (shouldSendEmail && client.email) {
      try {
        const emailText = `Hi ${client.name},\n\nPlease find attached your invoice ${savedInvoice.invoiceNumber} from Frame by DB.\n\nTotal: ₹${savedInvoice.total.toLocaleString('en-IN')}\nDue Date: ${savedInvoice.dueDate.toISOString().split('T')[0]}\n\nLog in to the Client Portal using access key "${client.accessKey}" to access all files.\n\nRegards,\nDasari Bharadwaj`;
        const attachmentFilename = `${savedInvoice.invoiceNumber}-${activeTheme}.pdf`;

        await sendEmail({
          to: client.email,
          subject: `Invoice ${savedInvoice.invoiceNumber} from Frame by DB`,
          text: emailText,
          attachments: [
            {
              filename: attachmentFilename,
              content: pdfBuffer,
              contentType: 'application/pdf'
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
