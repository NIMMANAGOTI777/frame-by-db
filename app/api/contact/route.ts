import { NextResponse } from 'next/server';
import { addBooking } from '@/lib/db';
import { z } from 'zod';

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
    const inquiry = {
      ...validatedData,
      date: new Date().toISOString().split('T')[0],
      eventType: 'General Inquiry',
      location: 'Website Contact Form',
      budget: 'N/A'
    };
    
    const newInquiry = await addBooking(inquiry);
    
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
