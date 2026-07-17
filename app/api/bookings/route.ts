import { NextResponse } from 'next/server';
import { getBookings, addBooking } from '@/lib/db';
import { z } from 'zod';
import React from 'react';
import { sendEmail } from '@/lib/email';
import BookingNotification from '@/emails/BookingNotification';
import BookingConfirmation from '@/emails/BookingConfirmation';

import { verifyAuth } from '@/lib/auth';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  date: z.string().min(5, 'Date is required'),
  eventType: z.string().min(2, 'Event type is required'),
  location: z.string().min(2, 'Location is required'),
  budget: z.string().optional(),
  message: z.string().optional(),
});

export async function GET() {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const bookings = await getBookings();
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validatedData = bookingSchema.parse(body);
    
    const newBooking = await addBooking(validatedData);
    
    // Send emails asynchronously
    const adminEmail = process.env.ADMIN_EMAIL || 'dopdasari@gmail.com';
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Fallbacks for text-only clients
    const founderText = `New Booking Request\n\nClient:\n${validatedData.name}\n\nEmail:\n${validatedData.email}\n\nPhone:\n${validatedData.phone}\n\nEvent:\n${validatedData.eventType}\n\nDate:\n${validatedData.date}\n\nLocation:\n${validatedData.location}\n\nBudget:\n${validatedData.budget || 'N/A'}\n\nMessage:\n${validatedData.message || 'N/A'}\n\nSubmitted:\n${formattedDate}`;
    const customerText = `Hi ${validatedData.name},\n\nThank you for choosing Frame by DB.\n\nWe have successfully received your booking request.\n\nOur team will contact you shortly to discuss your event.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB`;

    await Promise.allSettled([
      // 1. Notify Founder
      sendEmail({
        to: adminEmail,
        subject: '🎉 New Booking Request | Frame by DB',
        template: React.createElement(BookingNotification, {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          eventType: validatedData.eventType,
          eventDate: validatedData.date,
          location: validatedData.location,
          budget: validatedData.budget || 'N/A',
          message: validatedData.message || '',
          date: formattedDate
        }),
        text: founderText
      }),
      // 2. Confirm to Client
      sendEmail({
        to: validatedData.email,
        subject: 'Booking Request Received',
        template: React.createElement(BookingConfirmation, {
          name: validatedData.name
        }),
        text: customerText
      })
    ]);

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
