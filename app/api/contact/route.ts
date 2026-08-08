import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Contact, ClientModel, Booking } from '@/lib/models';
import { generateBookingId } from '@/lib/utils/generateBookingId';
import { sendEmail } from '@/lib/utils/sendEmail';

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();
    if (!name || !email || !phone || !message) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Save Contact submission log
    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    // 2. Save as Booking (General Inquiry) for Admin Dashboard visibility
    let client = await ClientModel.findOne({ email: email.trim().toLowerCase() });
    if (!client) {
      client = new ClientModel({
        name,
        email: email.trim().toLowerCase(),
        phone,
        accessKey: `KEY-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: '',
        billingAddress: 'Website Contact Form',
        downloads: [],
        albumPhotos: []
      });
      await client.save();
    }

    const bookingId = await generateBookingId();
    const newInquiry = new Booking({
      bookingId,
      clientId: client._id,
      name,
      phone,
      email: email.trim().toLowerCase(),
      date: new Date(),
      eventType: 'General Inquiry',
      location: 'Website Contact Form',
      budget: null,
      message,
      status: 'New',
      paymentStatus: 'pending'
    });

    const savedInquiry = await newInquiry.save();

    // 3. Dispatch emails
    const adminEmail = process.env.ADMIN_EMAIL;
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const founderText = `New Contact Inquiry\n\nName:\n${name}\n\nEmail:\n${email}\n\nPhone:\n${phone}\n\nMessage:\n${message}\n\nSubmitted At:\n${formattedDate}\n\nWebsite:\nFrame by DB`;
    const customerText = `Hi ${name},\n\nThank you for contacting Frame by DB.\n\nWe have received your inquiry and our team will review it shortly.\n\nWe usually respond within 24 hours.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB\nHyderabad`;

    try {
      if (adminEmail) {
        await sendEmail({
          to: adminEmail,
          subject: '📩 New Contact Inquiry | Frame by DB',
          text: founderText
        });
      }
      await sendEmail({
        to: email,
        subject: 'Thank you for contacting Frame by DB',
        text: customerText
      });
    } catch (emailErr) {
      console.error('Email dispatch error on contact submission:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        ...savedInquiry.toObject(),
        id: savedInquiry._id.toString()
      }
    });
  } catch (error: any) {
    console.error('Contact form submission error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
