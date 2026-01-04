import { createClient } from '@supabase/supabase-js';

/**
 * SECURITY CRITICAL: Server-side Supabase client with service role key
 * 
 * NEVER export this to client components or API responses
 * ONLY use in:
 * - Server components
 * - API routes
 * - Server actions
 * 
 * This client bypasses Row Level Security (RLS) and has full database access
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-client-info': `clubhouse-admin-${Date.now()}`, // Force new connection
      },
    },
  });
}
