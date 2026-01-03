export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Fetch all users from auth.users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Failed to fetch users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    return NextResponse.json(users.map(u => ({
      id: u.id,
      email: u.email,
      first_name: u.user_metadata?.first_name || null,
      last_name: u.user_metadata?.last_name || null
    })));

  } catch (error: any) {
    console.error('Unexpected error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
