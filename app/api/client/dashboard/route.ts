import { NextResponse } from 'next/server';
import { readDB, getClientById } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('client_session');
    if (!session || !session.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = session.value;
    const client = await getClientById(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const db = await readDB();

    // Row Level Security filter: only matching client records
    const clientBookings = db.bookings.filter(
      (b) => b.email.trim().toLowerCase() === client.email.trim().toLowerCase()
    );
    const clientInvoices = db.invoices.filter((inv) => inv.clientId === clientId);
    const invoiceIds = clientInvoices.map((inv) => inv.id);
    const clientPayments = db.payments.filter((pm) => invoiceIds.includes(pm.invoiceId));

    // Calculate Summary Stats
    const totalBookings = clientBookings.length;
    
    // Sum of successful payments
    const totalPaid = clientPayments
      .filter((pm) => pm.status === 'Success')
      .reduce((sum, pm) => sum + pm.amount, 0);

    // Sum of balance amount from all invoices
    const pendingBalance = clientInvoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

    // Count of approved bookings
    const activeProjects = clientBookings.filter((b) => b.status === 'approved').length;

    // Available downloads
    const availableDownloads = client.downloads || [];

    // Latest Booking Timeline
    const latestBooking = clientBookings[0] || null;
    let timeline: any[] = [];

    if (latestBooking) {
      const createdDate = new Date(latestBooking.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      
      const isPending = latestBooking.status === 'pending';
      const isApproved = latestBooking.status === 'approved';
      const isRejected = latestBooking.status === 'rejected';

      timeline = [
        {
          label: 'Inquiry Submitted',
          status: 'completed',
          date: createdDate,
        },
        {
          label: 'Review & Schedule Approval',
          status: isPending ? 'active' : 'completed',
          date: isPending ? 'Pending Review' : 'Approved',
        },
        {
          label: 'Pre-production Planning',
          status: isPending ? 'pending' : isApproved ? 'active' : 'pending',
          date: isApproved ? 'In Progress' : 'TBD',
        },
        {
          label: 'Main Production Shoot',
          status: 'pending',
          date: latestBooking.date,
        },
        {
          label: 'Post-production Editing & Album Binding',
          status: 'pending',
          date: 'Est. 4-6 weeks post shoot',
        },
      ];

      // Add a status for rejected
      if (isRejected) {
        timeline[1] = {
          label: 'Inquiry Rejected / Cancelled',
          status: 'failed',
          date: 'Cancelled',
        };
      }
    }

    return NextResponse.json({
      stats: {
        totalBookings,
        totalPaid,
        pendingBalance,
        activeProjects,
        availableDownloadsCount: availableDownloads.length,
      },
      recentInvoices: clientInvoices.slice(0, 5),
      recentPayments: clientPayments.slice(0, 5),
      downloads: availableDownloads,
      albumPhotos: client.albumPhotos || [],
      timeline,
      bookings: clientBookings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
