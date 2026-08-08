import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { Setting } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({
        businessName: 'Frame by DB',
        founderName: 'Dasari Bharadwaj',
        founderImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200',
        experienceYears: 16,
        location: 'Hyderabad, India',
        phone: '+91 99999 99999',
        email: 'contact@framebydb.com',
        logoUrl: '/images/logo.png',
        stats: [
          { label: 'Years Experience', value: '16+' },
          { label: 'Films & Campaigns', value: '500+' },
          { label: 'Weddings Documented', value: '250+' },
          { label: 'Creative Excellence', value: '100%' }
        ],
        awards: []
      });
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const updates = await request.json();
    let settings = await Setting.findOne();
    if (settings) {
      Object.assign(settings, updates);
      await settings.save();
    } else {
      settings = new Setting(updates);
      await settings.save();
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
