import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, first_name, last_name')
      .order('display_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }

    // Fetch auth users to get emails
    const { data: { users: authUsers }, error: authListError } = await supabaseAdmin.auth.admin.listUsers();

    if (authListError) {
      console.error('Error fetching auth users:', authListError);
      return NextResponse.json({ error: 'Failed to fetch auth users' }, { status: 500 });
    }

    // Combine profiles with emails
    const users = profiles?.map(profile => {
      const authUser = authUsers?.find(u => u.id === profile.id);
      return {
        id: profile.id,
        email: authUser?.email || 'Unknown',
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
      };
    }) || [];

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
