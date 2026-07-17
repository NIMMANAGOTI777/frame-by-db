import { NextResponse } from 'next/server';
import { getBookings, addBooking } from '@/lib/db';
import { z } from 'zod';

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
    
    // In a production app, we would invoke Nodemailer/React Email here.
    // For now, we return the successful database record.
    return NextResponse.json(newBooking, { status: 201 });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || 'Validation error' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
