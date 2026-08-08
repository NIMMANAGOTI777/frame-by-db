import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const useMock = process.env.NODE_ENV !== 'production' && (!supabaseUrl || supabaseUrl.includes('[id]') || supabaseAnonKey === 'your-anon-key');

// Validate credentials at runtime startup ONLY if NOT using mock
if (!isBuildTime && !useMock) {
  if (!supabaseUrl || supabaseUrl.includes('[id]')) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable.');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.');
  }
  if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }
}

let supabaseInstance: any;
let supabaseAdminInstance: any;

if (useMock) {
  if (typeof window === 'undefined') {
    console.log('--- NEXT_PUBLIC_SUPABASE_URL is placeholder/empty. Initializing local JSON Supabase Mock ---');
  }

  const dbPath = path.join(process.cwd(), 'database', 'db.json');

  const getMockUsers = () => {
    try {
      if (!fs.existsSync(dbPath)) return [];
      const content = fs.readFileSync(dbPath, 'utf8');
      const db = JSON.parse(content);
      const list: any[] = [];
      if (db.users) {
        db.users.forEach((u: any) => {
          list.push({ id: u.id || u.authUserId || 'mock-admin-id', email: `${u.username}@framebydb.com`, role: u.role });
        });
      }
      if (db.clients) {
        db.clients.forEach((c: any) => {
          list.push({ id: c.id || c.authUserId || 'mock-client-id', email: c.email, role: 'client' });
        });
      }
      if (db.admins) {
        db.admins.forEach((a: any) => {
          list.push({ id: a.id || a.authUserId || 'mock-admin-id-2', email: a.email, role: 'admin' });
        });
      }
      return list;
    } catch (e) {
      console.error('Error reading mock users from db.json:', e);
      return [];
    }
  };

  supabaseInstance = {
    auth: {
      getUser: async (token: string) => {
        if (!token || !token.startsWith('mock-token-')) {
          return { data: { user: null }, error: { message: 'Invalid token' } };
        }
        const email = token.replace('mock-token-', '');
        const users = getMockUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          return { data: { user: { id: user.id, email: user.email } }, error: null };
        }
        return { data: { user: null }, error: { message: 'User not found' } };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const users = getMockUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          return {
            data: {
              session: {
                access_token: `mock-token-${user.email}`,
                user: { id: user.id, email: user.email }
              }
            },
            error: null
          };
        }
        return { data: { session: null }, error: { message: 'Invalid credentials' } };
      },
      signOut: async () => {
        return { error: null };
      }
    }
  };

  supabaseAdminInstance = {
    auth: {
      admin: {
        createUser: async (params: any) => {
          const newId = crypto.randomUUID();
          return {
            data: {
              user: { id: newId, email: params.email }
            },
            error: null
          };
        },
        listUsers: async (params?: any) => {
          const users = getMockUsers().map(u => ({
            id: u.id,
            email: u.email,
            user_metadata: { role: u.role }
          }));
          return { data: { users }, error: null };
        }
      }
    }
  };

} else {
  // Use a syntactically valid dummy fallback URL/key only during build time to allow compilation to succeed
  const activeUrl = isBuildTime && (!supabaseUrl || supabaseUrl.includes('[id]')) 
    ? 'https://dummy.supabase.co' 
    : supabaseUrl;

  const activeAnonKey = isBuildTime && (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') 
    ? 'dummy-anon-key' 
    : supabaseAnonKey;

  const activeServiceKey = isBuildTime && (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') 
    ? 'dummy-service-key' 
    : supabaseServiceKey;

  supabaseInstance = createClient(activeUrl, activeAnonKey);

  supabaseAdminInstance = createClient(activeUrl, activeServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export const supabase = supabaseInstance;
export const supabaseAdmin = supabaseAdminInstance;

export async function getSupabaseUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    if (error || !data) return null;
    return data.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase()) || null;
  } catch (err) {
    console.error('Error fetching user by email:', err);
    return null;
  }
}

