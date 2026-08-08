import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Booking, ClientModel } from '@/lib/models';
import { generateBookingId } from '@/lib/utils/generateBookingId';
import { sendEmail } from '@/lib/utils/sendEmail';

export async function GET() {
  try {
    await connectToDatabase();
    const bookings = await Booking.find().sort({ createdAt: -1 });
    const mapped = bookings.map(b => ({
      ...b.toObject(),
      id: b._id.toString(),
      clientId: b.clientId ? b.clientId.toString() : null
    }));
    return NextResponse.json(mapped);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    const bookingData = await request.json();
    if (!bookingData.email || !bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.eventType || !bookingData.location) {
      return NextResponse.json({ success: false, error: 'Required booking fields are missing' }, { status: 400 });
    }

    let client = await ClientModel.findOne({ email: bookingData.email.trim().toLowerCase() });
    const accessKey = bookingData.accessKey || `KEY-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!client) {
      client = new ClientModel({
        name: bookingData.name,
        email: bookingData.email.trim().toLowerCase(),
        phone: bookingData.phone,
        accessKey,
        companyName: '',
        billingAddress: bookingData.location,
        downloads: [],
        albumPhotos: []
      });
      await client.save();
    }

    let parsedBudget = null;
    if (bookingData.budget !== undefined && bookingData.budget !== null && bookingData.budget !== '') {
      parsedBudget = typeof bookingData.budget === 'number' ? bookingData.budget : parseFloat(String(bookingData.budget).replace(/[^0-9.]/g, ''));
    }

    const bookingId = await generateBookingId();

    const newBooking = new Booking({
      bookingId,
      clientId: client._id,
      name: bookingData.name,
      phone: bookingData.phone,
      email: bookingData.email.trim().toLowerCase(),
      date: new Date(bookingData.date),
      eventType: bookingData.eventType,
      location: bookingData.location,
      budget: parsedBudget,
      message: bookingData.message || '',
      status: 'New',
      paymentStatus: 'pending'
    });

    const savedBooking = await newBooking.save();

    // Dispatch email notification
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `📅 New Booking Received: ${bookingId}`,
        text: `New Booking Request\n\nBooking ID: ${bookingId}\nName: ${bookingData.name}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nEvent Type: ${bookingData.eventType}\nDate: ${bookingData.date}\nLocation: ${bookingData.location}`
      }).catch(err => console.error('Email error:', err));
    }

    return NextResponse.json({
      success: true,
      bookingId: savedBooking.bookingId,
      data: {
        ...savedBooking.toObject(),
        id: savedBooking._id.toString(),
        clientId: client._id.toString()
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create booking error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
