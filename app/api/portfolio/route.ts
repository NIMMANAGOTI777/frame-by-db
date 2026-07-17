import { NextResponse } from 'next/server';
import { getPortfolio, addPortfolioItem } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  try {
    const portfolio = await getPortfolio();
    return NextResponse.json(portfolio);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await verifyAuth())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const newItem = await addPortfolioItem(body);
    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
