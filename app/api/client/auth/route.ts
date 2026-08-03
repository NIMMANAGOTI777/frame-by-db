import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { supabase, supabaseAdmin, getSupabaseUserByEmail } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { convertDecimals } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { accessKey } = await request.json();
    if (!accessKey) {
      return NextResponse.json({ error: 'Access key is required' }, { status: 400 });
    }

    // Find client in database
    let client = await prisma.client.findUnique({
      where: { accessKey }
    });

    if (!client) {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 });
    }

    // Ensure client has a Supabase Auth user
    let supabaseUserId = client.authUserId;
    if (!supabaseUserId) {
      try {
        const existingUser = await getSupabaseUserByEmail(client.email);
        if (existingUser) {
          supabaseUserId = existingUser.id;
        } else {
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: client.email,
            password: accessKey,
            email_confirm: true,
            user_metadata: { role: 'client' }
          });
          if (createError) throw createError;
          supabaseUserId = newUser.user.id;
        }

        // Link authUserId in database
        client = await prisma.client.update({
          where: { id: client.id },
          data: { authUserId: supabaseUserId }
        });
      } catch (authErr: any) {
        console.error('Error provisioning client in Supabase Auth:', authErr);
      }
    }

    // Authenticate with Supabase Auth
    const { data: authSession, error: signInError } = await supabase.auth.signInWithPassword({
      email: client.email,
      password: accessKey
    });

    if (signInError || !authSession.session) {
      return NextResponse.json({ error: signInError?.message || 'Supabase authentication failed' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      client: convertDecimals({ id: client.id, name: client.name, email: client.email })
    });

    const cookieStore = await cookies();
    
    // Set cookie for client session (backward-compatible)
    cookieStore.set('client_session', client.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    // Set cookie for Supabase JWT
    cookieStore.set('sb-access-token', authSession.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return NextResponse.json({ isLoggedIn: false });
    }

    const client = await prisma.client.findUnique({
      where: { authUserId: user.id }
    });
    if (!client) {
      return NextResponse.json({ isLoggedIn: false });
    }

    return NextResponse.json({ isLoggedIn: true, client: convertDecimals(client) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  cookieStore.delete('client_session');
  cookieStore.delete('sb-access-token');
  await supabase.auth.signOut();
  return response;
}
