import { createAdminClient } from '@/lib/supabaseAdminServer';
import { createServerClient } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Create server client for auth
    const supabase = await createServerClient();

    // Sign in
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !authData.user) {
      return NextResponse.json(
        { error: signInError?.message || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Check if user is admin using service role (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: adminCheck, error: adminError } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', authData.user.id)
      .single();

    if (adminError || !adminCheck) {
      // Not an admin, sign them out
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Access denied. You must be an authorized admin.' },
        { status: 403 }
      );
    }

    // Success
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
