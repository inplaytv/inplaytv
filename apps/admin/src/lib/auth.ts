import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { createAdminClient } from './supabaseAdminServer';

/**
 * Create server-side Supabase client using HTTP-only cookies
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const adminClient = createAdminClient();
  
  const { data } = await adminClient
    .rpc('is_admin', { uid: userId });
  
  return data === true;
}

/**
 * Assert user is admin or redirect to login
 * Use this in protected admin pages
 */
export async function assertAdminOrRedirect() {
  // DEVELOPMENT BYPASS: Skip auth checks entirely in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode - skipping admin auth check');
    return {
      id: 'dev-user-id',
      email: 'dev@admin.local',
      created_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      role: 'authenticated'
    };
  }

  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  const userIsAdmin = await isAdmin(user.id);
  
  if (!userIsAdmin) {
    redirect('/login?error=unauthorized');
  }
  
  return user;
}
