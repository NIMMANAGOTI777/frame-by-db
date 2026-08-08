import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { connectToDatabase } from '@/lib/mongodb';
import { ClientModel } from '@/lib/models';
import { verifyClient } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const client = await ClientModel.findById(clientUser.id);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...client.toObject(),
      id: client._id.toString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const clientUser = await verifyClient(request);
    if (!clientUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, companyName, billingAddress } = await request.json();
    await connectToDatabase();

    const client = await ClientModel.findByIdAndUpdate(
      clientUser.id,
      { name, phone, companyName, billingAddress },
      { new: true }
    );

    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: {
        ...client.toObject(),
        id: client._id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
