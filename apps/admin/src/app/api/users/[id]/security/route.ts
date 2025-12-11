import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

/**
 * Get user's security settings including MFA status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const adminClient = createAdminClient();

    // Verify admin user
    const { data: { user: adminUser }, error: adminAuthError } = await adminClient.auth.getUser();
    if (adminAuthError || !adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminRecord } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', adminUser.id)
      .single();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user security settings
    const { data: securitySettings, error: settingsError } = await adminClient
      .from('user_security_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching security settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
    }

    // Get recent login attempts
    const { data: loginAttempts, error: attemptsError } = await adminClient
      .from('user_login_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('attempted_at', { ascending: false })
      .limit(10);

    // Get active sessions
    const { data: sessions, error: sessionsError } = await adminClient
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('last_activity_at', { ascending: false });

    return NextResponse.json({
      security_settings: securitySettings || {
        user_id: userId,
        mfa_enabled: false,
        mfa_method: 'email',
        email_verification_required: false,
      },
      login_attempts: loginAttempts || [],
      active_sessions: sessions || [],
    });

  } catch (error) {
    console.error('Get security settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
