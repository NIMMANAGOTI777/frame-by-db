import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { supabase, supabaseAdmin, getSupabaseUserByEmail } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // 1. Look up in Admin table first
    let adminRecord = await prisma.admin.findUnique({
      where: { username }
    });

    // 2. Look up in User table if not found
    let userRecord = null;
    if (!adminRecord) {
      userRecord = await prisma.user.findUnique({
        where: { username }
      });
    }

    const account = adminRecord || userRecord;
    if (!account) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password against bcrypt hash
    const isPasswordCorrect = bcrypt.compareSync(password, account.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const email = adminRecord?.email || `${username}@framebydb.com`;

    // Ensure they have a Supabase Auth user
    let supabaseUserId = account.authUserId;
    if (!supabaseUserId) {
      try {
        const existingUser = await getSupabaseUserByEmail(email);
        if (existingUser) {
          supabaseUserId = existingUser.id;
        } else {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
          });
          if (createError) throw createError;
          supabaseUserId = newUser.user.id;
        }

        // Link authUserId in our DB
        if (adminRecord) {
          adminRecord = await prisma.admin.update({
            where: { id: adminRecord.id },
            data: { authUserId: supabaseUserId }
          });
        } else if (userRecord) {
          userRecord = await prisma.user.update({
            where: { id: userRecord.id },
            data: { authUserId: supabaseUserId }
          });
        }
      } catch (authErr: any) {
        console.error('Error provisioning admin in Supabase Auth:', authErr);
      }
    }

    // Authenticate with Supabase Auth
    const { data: authSession, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError || !authSession.session) {
      return NextResponse.json({ error: signInError?.message || 'Supabase authentication failed' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: { username: account.username, role: 'admin' }
    });

    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', authSession.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('sb-access-token');
  await supabase.auth.signOut();
  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-access-token')?.value;
  if (!token) {
    return NextResponse.json({ isLoggedIn: false });
  }

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return NextResponse.json({ isLoggedIn: false });
  }

  return NextResponse.json({ isLoggedIn: true });
}
