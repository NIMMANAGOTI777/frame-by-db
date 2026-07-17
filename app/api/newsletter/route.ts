import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    
    const logPath = path.join(process.cwd(), 'database', 'newsletter.txt');
    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      await fs.promises.mkdir(logDir, { recursive: true });
    }
    
    await fs.promises.appendFile(logPath, `${new Date().toISOString()} - ${email}\n`, 'utf8');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
