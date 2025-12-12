import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return NextResponse.json({ 
        error: 'Failed to fetch auth users', 
        details: authError.message 
      }, { status: 500 });
    }

    // Get all profiles from public.profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    // Get deleted users (if soft delete exists)
    const { data: deletedProfiles, error: deletedError } = await supabase
      .from('profiles')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    // Check for any audit logs or deletion records
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .or('action.eq.user_deleted,action.eq.profile_deleted')
      .order('created_at', { ascending: false })
      .limit(50);

    return NextResponse.json({
      summary: {
        total_auth_users: authUsers.users.length,
        total_profiles: profiles?.length || 0,
        deleted_profiles: deletedProfiles?.length || 0,
        recent_deletions: auditLogs?.length || 0,
      },
      auth_users: authUsers.users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        banned: user.banned_until ? true : false,
      })),
      profiles: profiles || [],
      deleted_profiles: deletedProfiles || [],
      audit_logs: auditLogs || [],
    }, { status: 200 });

  } catch (error: any) {
    console.error('Debug users error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
