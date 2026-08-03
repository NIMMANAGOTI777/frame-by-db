import { cookies } from 'next/headers';
import { supabase } from './supabase';
import { prisma } from './prisma';

export async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) return false;

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    // Cross-reference with Admin table
    const adminExists = await prisma.admin.findUnique({
      where: { authUserId: user.id }
    });
    if (adminExists) return true;

    // Cross-reference with User table (role admin)
    const userExists = await prisma.user.findUnique({
      where: { authUserId: user.id }
    });
    if (userExists && userExists.role === 'admin') return true;

    return false;
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}
