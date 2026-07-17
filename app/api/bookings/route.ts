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
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
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
    console.log("Incoming Booking request body:", body);
    
    // Validate request body
    const result = bookingSchema.safeParse(body);
    if (!result.success) {
      console.warn("Booking Zod validation failed:", result.error.format());
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      return NextResponse.json({
        success: false,
        message: "Validation failed",
        errors
      }, { status: 400 });
    }
    
    const validatedData = result.data;
    console.log("Parsed/Validated booking request body:", validatedData);
    
    let newBooking;
    try {
      newBooking = await addBooking(validatedData);
      console.log("Booking saved to database successfully.");
    } catch (dbError: any) {
      console.error("Booking database save error:", dbError);
      return NextResponse.json({
        success: false,
        message: "Failed to save booking to database",
        error: dbError.message
      }, { status: 500 });
    }
    
    // Send emails asynchronously
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.warn("ADMIN_EMAIL environment variable is not configured. Booking notification email will not be sent.");
    }
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Fallbacks for text-only clients
    const founderText = `New Booking Request\n\nClient:\n${validatedData.name}\n\nEmail:\n${validatedData.email}\n\nPhone:\n${validatedData.phone}\n\nEvent:\n${validatedData.eventType}\n\nDate:\n${validatedData.date}\n\nLocation:\n${validatedData.location}\n\nBudget:\n${validatedData.budget || 'N/A'}\n\nMessage:\n${validatedData.message || 'N/A'}\n\nSubmitted:\n${formattedDate}`;
    const customerText = `Hi ${validatedData.name},\n\nThank you for choosing Frame by DB.\n\nWe have successfully received your booking request.\n\nOur team will contact you shortly to discuss your event.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB`;

    console.log("Dispatching booking email notifications...");
    const emailResults = await Promise.allSettled([
      // 1. Notify Founder (if ADMIN_EMAIL configured)
      adminEmail ? sendEmail({
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
      }) : Promise.resolve({ messageId: 'skipped-no-admin-configured' }),
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

    emailResults.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(`Booking email task ${index + 1} failed:`, res.reason);
      } else {
        console.log(`Booking email task ${index + 1} succeeded.`);
      }
    });

    return NextResponse.json({
      success: true,
      message: "Booking submitted successfully",
      data: newBooking
    }, { status: 200 });
  } catch (error: any) {
    console.error("General API Error in bookings POST handler:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred"
    }, { status: 500 });
  }
}
