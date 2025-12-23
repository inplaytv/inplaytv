import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Get all admins (bypasses RLS using service role)
    const { data: adminData, error: adminError } = await adminClient
      .from('admins')
      .select('user_id, created_at, is_super_admin')
      .order('is_super_admin', { ascending: false })
      .order('created_at', { ascending: true });

    if (adminError) throw adminError;

    // Get all auth users
    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) throw usersError;

    // Get profiles for display names
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, display_name, username, first_name, last_name');

    const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    const admins = adminData?.map((admin: any) => {
      const user = userMap.get(admin.user_id);
      const profile = profileMap.get(admin.user_id);
      return {
        user_id: admin.user_id,
        created_at: admin.created_at,
        is_super_admin: admin.is_super_admin || false,
        email: user?.email || 'N/A',
        full_name: profile?.display_name || profile?.username || user?.user_metadata?.full_name || user?.raw_user_meta_data?.full_name || user?.email || 'N/A',
      };
    }) || [];

    return NextResponse.json({ admins });
  } catch (error: any) {
    console.error('Error fetching admins list:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}
