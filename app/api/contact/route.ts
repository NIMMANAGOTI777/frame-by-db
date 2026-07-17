import { NextResponse } from 'next/server';
import { addBooking } from '@/lib/db';
import { z } from 'zod';
import React from 'react';
import { sendEmail } from '@/lib/email';
import ContactNotification from '@/emails/ContactNotification';
import ContactConfirmation from '@/emails/ContactConfirmation';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = contactSchema.parse(body);
    
    // Store as general inquiry in bookings database
    const dateStr = new Date().toISOString().split('T')[0];
    const inquiry = {
      ...validatedData,
      date: dateStr,
      eventType: 'General Inquiry',
      location: 'Website Contact Form',
      budget: 'N/A'
    };
    
    const newInquiry = await addBooking(inquiry);

    // Send emails asynchronously
    const adminEmail = process.env.ADMIN_EMAIL || 'dopdasari@gmail.com';
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Fallbacks for text-only clients
    const founderText = `New Contact Inquiry\n\nName:\n${validatedData.name}\n\nEmail:\n${validatedData.email}\n\nPhone:\n${validatedData.phone}\n\nMessage:\n${validatedData.message}\n\nSubmitted At:\n${formattedDate}\n\nWebsite:\nFrame by DB`;
    const customerText = `Hi ${validatedData.name},\n\nThank you for contacting Frame by DB.\n\nWe have received your inquiry and our team will review it shortly.\n\nWe usually respond within 24 hours.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB\nHyderabad`;

    await Promise.allSettled([
      // 1. Notify Founder
      sendEmail({
        to: adminEmail,
        subject: '📩 New Contact Inquiry | Frame by DB',
        template: React.createElement(ContactNotification, {
          name: validatedData.name,
          email: validatedData.email,
          phone: validatedData.phone,
          message: validatedData.message,
          date: formattedDate
        }),
        text: founderText
      }),
      // 2. Confirm to Client
      sendEmail({
        to: validatedData.email,
        subject: 'Thank you for contacting Frame by DB',
        template: React.createElement(ContactConfirmation, {
          name: validatedData.name
        }),
        text: customerText
      })
    ]);
    
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
