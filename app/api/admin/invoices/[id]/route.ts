import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice, ClientModel, Booking, Setting } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoicePDF } from '@/lib/utils/generateInvoicePDF';
import { computeInvoicePaymentStatus } from '@/lib/constants/payment';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const invoice = await Invoice.findById(id)
      .populate('clientId')
      .populate('bookingId');

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const obj = invoice.toObject();
    return NextResponse.json({
      ...obj,
      id: invoice._id.toString(),
      paidAmount: obj.paidAmount || 0,
      balanceAmount: obj.balanceAmount !== undefined ? obj.balanceAmount : Math.max(0, (obj.total || 0) - (obj.paidAmount || 0)),
      paymentStatus: obj.paymentStatus || computeInvoicePaymentStatus(obj),
      clientId: invoice.clientId ? {
        ...invoice.clientId.toObject(),
        id: invoice.clientId._id.toString()
      } : null,
      bookingId: invoice.bookingId ? {
        ...invoice.bookingId.toObject(),
        id: invoice.bookingId._id.toString()
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const updates = await request.json();

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    if (updates.items) {
      invoice.items = updates.items;
      invoice.subtotal = updates.items.reduce((sum: number, item: any) => sum + (Number(item.price || item.rate || 0) * Number(item.quantity || 1)), 0);
    }

    if (updates.invoiceNumber) invoice.invoiceNumber = updates.invoiceNumber;
    if (updates.createdBy !== undefined) invoice.createdBy = updates.createdBy;
    if (updates.billedBy !== undefined) invoice.billedBy = updates.billedBy;
    if (updates.billedTo !== undefined) invoice.billedTo = updates.billedTo;
    if (updates.bankDetails !== undefined) invoice.bankDetails = updates.bankDetails;
    if (updates.upiId !== undefined) invoice.upiId = updates.upiId;
    if (updates.qrCodeUrl !== undefined) invoice.qrCodeUrl = updates.qrCodeUrl;
    if (updates.upiNote !== undefined) invoice.upiNote = updates.upiNote;
    if (updates.signatureUrl !== undefined) invoice.signatureUrl = updates.signatureUrl;

    if (updates.tax !== undefined) invoice.tax = Number(updates.tax);
    if (updates.cgst !== undefined) invoice.cgst = Number(updates.cgst);
    if (updates.sgst !== undefined) invoice.sgst = Number(updates.sgst);
    if (updates.discount !== undefined) invoice.discount = Number(updates.discount);
    if (updates.discountType !== undefined) invoice.discountType = updates.discountType;
    if (updates.discountValue !== undefined) invoice.discountValue = Number(updates.discountValue);
    if (updates.paidAmount !== undefined) invoice.paidAmount = Number(updates.paidAmount);
    if (updates.status) invoice.status = updates.status;
    if (updates.paymentMethod !== undefined) invoice.paymentMethod = updates.paymentMethod;
    if (updates.paymentDate !== undefined) invoice.paymentDate = updates.paymentDate ? new Date(updates.paymentDate) : null;
    if (updates.transactionId !== undefined) invoice.transactionId = updates.transactionId;
    if (updates.notes !== undefined) invoice.notes = updates.notes;
    if (updates.terms !== undefined) invoice.terms = updates.terms;
    if (updates.invoiceTheme) invoice.invoiceTheme = updates.invoiceTheme;
    if (updates.issueDate) invoice.issueDate = new Date(updates.issueDate);
    if (updates.dueDate) invoice.dueDate = new Date(updates.dueDate);

    invoice.total = invoice.subtotal + Number(invoice.tax || 0) - Number(invoice.discount || 0);
    invoice.balanceAmount = Math.max(0, invoice.total - Number(invoice.paidAmount || 0));

    invoice.paymentStatus = computeInvoicePaymentStatus(invoice);
    if (updates.status) {
      invoice.status = updates.status;
    } else if (invoice.balanceAmount === 0) {
      invoice.status = 'Paid';
    } else if (invoice.paidAmount > 0 && invoice.status !== 'Cancelled') {
      invoice.status = 'Partially Paid';
    }

    invoice.history.push({
      action: 'Invoice Updated',
      date: new Date(),
      notes: updates.notes || 'Updated by admin'
    });

    const saved = await invoice.save();

    const client = await ClientModel.findById(saved.clientId);
    const settings = (await Setting.findOne()) || {};
    const booking = saved.bookingId ? await Booking.findById(saved.bookingId) : null;
    await generateInvoicePDF(saved, client, saved.items, booking, settings, saved.invoiceTheme);

    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
