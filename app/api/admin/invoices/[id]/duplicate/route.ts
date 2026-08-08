import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Invoice } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';
import { generateInvoiceNumber } from '@/lib/utils/generateInvoiceNumber';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const original = await Invoice.findById(id);
    if (!original) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const duplicated = new Invoice({
      ...original.toObject(),
      _id: undefined,
      invoiceNumber,
      status: 'Draft',
      paidAmount: 0,
      balanceAmount: original.total,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      history: [{
        action: 'Invoice Duplicated',
        date: new Date(),
        notes: `Duplicated from ${original.invoiceNumber}`
      }]
    });

    const saved = await duplicated.save();
    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
