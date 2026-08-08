// Mock Supabase Client proxy to satisfy Next.js compiler build.
// Actual database operations run via the external Express + Mongoose server.
export const supabase = new Proxy({}, {
  get: () => {
    return () => ({});
  }
}) as any;

export const supabaseAdmin = new Proxy({}, {
  get: () => {
    return () => ({});
  }
}) as any;

export async function getSupabaseUserByEmail(email: string): Promise<any> {
  return null;
}
