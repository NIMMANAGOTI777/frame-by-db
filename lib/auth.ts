import { cookies } from 'next/headers';

export async function verifyAuth(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return session?.value === 'true';
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
}
