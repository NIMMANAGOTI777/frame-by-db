import { createClient } from '@supabase/supabase-js';

const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Validate credentials at runtime startup
if (!isBuildTime) {
  if (!supabaseUrl || supabaseUrl.includes('[id]')) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key') {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
}

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

export const supabase = createClient(activeUrl, activeAnonKey);

export const supabaseAdmin = createClient(activeUrl, activeServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function getSupabaseUserByEmail(email: string) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000
    });
    if (error || !data) return null;
    return data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) || null;
  } catch (err) {
    console.error('Error fetching user by email:', err);
    return null;
  }
}
