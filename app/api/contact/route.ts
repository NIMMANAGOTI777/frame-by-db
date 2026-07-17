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
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Incoming Contact form request body:", body);
    
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      console.warn("Zod validation failed:", result.error.format());
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
    console.log("Parsed/Validated request body:", validatedData);
    
    // Store as general inquiry in bookings database
    const dateStr = new Date().toISOString().split('T')[0];
    const inquiry = {
      ...validatedData,
      date: dateStr,
      eventType: 'General Inquiry',
      location: 'Website Contact Form',
      budget: 'N/A'
    };
    
    let newInquiry;
    try {
      newInquiry = await addBooking(inquiry);
      console.log("Inquiry saved to database successfully.");
    } catch (dbError: any) {
      console.error("Database save error:", dbError);
      return NextResponse.json({
        success: false,
        message: "Failed to save inquiry to database",
        error: dbError.message
      }, { status: 500 });
    }

    // Send emails asynchronously
    const adminEmail = process.env.ADMIN_EMAIL || 'dopdasari@gmail.com';
    const formattedDate = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Fallbacks for text-only clients
    const founderText = `New Contact Inquiry\n\nName:\n${validatedData.name}\n\nEmail:\n${validatedData.email}\n\nPhone:\n${validatedData.phone}\n\nMessage:\n${validatedData.message}\n\nSubmitted At:\n${formattedDate}\n\nWebsite:\nFrame by DB`;
    const customerText = `Hi ${validatedData.name},\n\nThank you for contacting Frame by DB.\n\nWe have received your inquiry and our team will review it shortly.\n\nWe usually respond within 24 hours.\n\nRegards,\n\nDasari Bharadwaj\nFrame by DB\nHyderabad`;

    console.log("Dispatching email notifications...");
    const emailResults = await Promise.allSettled([
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

    emailResults.forEach((res, index) => {
      if (res.status === 'rejected') {
        console.error(`Email task ${index + 1} failed:`, res.reason);
      } else {
        console.log(`Email task ${index + 1} succeeded.`);
      }
    });
    
    return NextResponse.json({
      success: true,
      message: "Inquiry submitted successfully",
      data: newInquiry
    }, { status: 200 });
  } catch (error: any) {
    console.error("General API Error in contact POST handler:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "An unexpected error occurred"
    }, { status: 500 });
  }
}
