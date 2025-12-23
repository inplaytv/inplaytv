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
        setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
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
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      redirect('/login');
    }
    
    // Check if user is actually an admin in the database
    const adminClient = createAdminClient();
    const { data: adminRecord, error: adminError } = await adminClient
      .from('admins')
      .select('user_id, is_super_admin')
      .eq('user_id', user.id)
      .single();
    
    if (adminError || !adminRecord) {
      console.error('User not in admins table:', user?.email, user?.id, adminError);
      redirect('/login?error=unauthorized');
    }
    
    return user;
  } catch (error: any) {
    console.error('Auth error:', error.message);
    throw error;
  }
}
