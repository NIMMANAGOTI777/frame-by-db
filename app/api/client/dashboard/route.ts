import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { ClientModel, Booking, Invoice, PaymentModel } from '@/lib/models';
import { verifyClient } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const client = await ClientModel.findById(clientUser.id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    const clientBookings = await Booking.find({
      email: client.email.trim().toLowerCase()
    }).sort({ createdAt: -1 });

    const clientInvoices = await Invoice.find({ clientId: client._id }).sort({ createdAt: -1 });
    const invoiceIds = clientInvoices.map(inv => inv._id);

    const clientPayments = await PaymentModel.find({ invoiceId: { $in: invoiceIds } }).sort({ createdAt: -1 });

    const totalBookings = clientBookings.length;
    const totalPaid = clientPayments
      .filter(pm => pm.status === 'Success')
      .reduce((sum, pm) => sum + pm.amount, 0);

    const pendingBalance = clientInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);
    const activeProjects = clientBookings.filter(b => b.status === 'Confirmed').length;
    const availableDownloads = client.downloads || [];

    const latestBooking = clientBookings[0] || null;
    let timeline: any[] = [];

    if (latestBooking) {
      const createdDate = new Date(latestBooking.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const isNew = latestBooking.status === 'New';
      const isConfirmed = latestBooking.status === 'Confirmed';
      const isCompleted = latestBooking.status === 'Shoot Completed';
      const isCancelled = latestBooking.status === 'Cancelled';

      timeline = [
        {
          label: 'Inquiry Submitted',
          status: 'completed',
          date: createdDate
        },
        {
          label: 'Review & Schedule Approval',
          status: isNew ? 'active' : 'completed',
          date: isNew ? 'Pending Review' : 'Approved'
        },
        {
          label: 'Pre-production Planning',
          status: isNew ? 'pending' : isConfirmed ? 'active' : 'completed',
          date: isConfirmed ? 'In Progress' : isNew ? 'TBD' : 'Completed'
        },
        {
          label: 'Main Production Shoot',
          status: isCompleted ? 'completed' : isConfirmed ? 'pending' : 'pending',
          date: latestBooking.date ? latestBooking.date.toISOString().split('T')[0] : 'TBD'
        },
        {
          label: 'Post-production Editing & Album Binding',
          status: isCompleted ? 'active' : 'pending',
          date: 'Est. 4-6 weeks post shoot'
        }
      ];

      if (isCancelled) {
        timeline[1] = {
          label: 'Inquiry Cancelled',
          status: 'failed',
          date: 'Cancelled'
        };
      }
    }

    const mappedInvoices = clientInvoices.map(inv => ({
      ...inv.toObject(),
      id: inv._id.toString(),
      clientId: inv.clientId.toString(),
      bookingId: inv.bookingId ? inv.bookingId.toString() : null
    }));

    const mappedPayments = clientPayments.map(pm => ({
      ...pm.toObject(),
      id: pm._id.toString(),
      invoiceId: pm.invoiceId.toString()
    }));

    const mappedBookings = clientBookings.map(b => ({
      ...b.toObject(),
      id: b._id.toString(),
      clientId: b.clientId ? b.clientId.toString() : null,
      date: b.date ? b.date.toISOString().split('T')[0] : null
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalBookings,
        totalPaid,
        pendingBalance,
        activeProjects,
        availableDownloadsCount: availableDownloads.length
      },
      client: {
        id: client._id.toString(),
        name: client.name,
        email: client.email,
        accessKey: client.accessKey
      },
      timeline,
      latestBooking: latestBooking ? {
        ...latestBooking.toObject(),
        id: latestBooking._id.toString()
      } : null,
      bookings: mappedBookings,
      invoices: mappedInvoices,
      payments: mappedPayments,
      downloads: availableDownloads,
      albumPhotos: client.albumPhotos || []
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
