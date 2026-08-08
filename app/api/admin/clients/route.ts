import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { ClientModel } from '@/lib/models';
import { verifyAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const clients = await ClientModel.find().sort({ createdAt: -1 });
    const mapped = clients.map(c => ({
      ...c.toObject(),
      id: c._id.toString()
    }));
    return NextResponse.json(mapped);
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
    const { name, email, phone, companyName, billingAddress } = await request.json();

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const exists = await ClientModel.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return NextResponse.json({ success: false, error: 'Client with this email already exists' }, { status: 400 });
    }

    const accessKey = `KEY-${Math.floor(1000 + Math.random() * 9000)}`;

    const newClient = new ClientModel({
      name,
      email: email.trim().toLowerCase(),
      phone,
      companyName: companyName || '',
      billingAddress: billingAddress || '',
      accessKey,
      downloads: [],
      albumPhotos: []
    });

    const saved = await newClient.save();
    return NextResponse.json({
      ...saved.toObject(),
      id: saved._id.toString()
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
