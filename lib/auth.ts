import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_key';

export interface AdminJwtPayload {
  id: string;
  username: string;
  role: 'admin';
}

export interface ClientJwtPayload {
  id: string;
  name: string;
  email: string;
  role: 'client';
}

export async function verifyAdmin(request?: Request): Promise<AdminJwtPayload | null> {
  try {
    let token: string | undefined;

    // Check cookies first
    const cookieStore = await cookies();
    token = cookieStore.get('admin_token')?.value;

    // Fallback to Authorization header
    if (!token && request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
    if (decoded && decoded.role === 'admin') {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function verifyClient(request?: Request): Promise<ClientJwtPayload | null> {
  try {
    let token: string | undefined;

    const cookieStore = await cookies();
    token = cookieStore.get('client_token')?.value;

    if (!token && request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as ClientJwtPayload;
    if (decoded && decoded.role === 'client') {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

export function signClientToken(payload: ClientJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
