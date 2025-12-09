import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Get search query if provided
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    // Use admin client to query the view
    const adminClient = createAdminClient();
    
    let query = adminClient
      .from('admin_users_with_wallets')
      .select('*')
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,username.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: users, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching users:', queryError);
      return NextResponse.json({ error: 'Failed to fetch users', details: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error('Unexpected error in wallet users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
