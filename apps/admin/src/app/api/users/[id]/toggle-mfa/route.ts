import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

/**
 * Toggle MFA (Multi-Factor Authentication) for a user
 * Admin can enable/disable MFA for any user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const { mfa_enabled, mfa_method = 'email' } = await request.json();

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

    // Check if user exists
    const { data: { user: targetUser }, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Upsert user security settings
    const { data: securitySettings, error: settingsError } = await adminClient
      .from('user_security_settings')
      .upsert({
        user_id: userId,
        mfa_enabled: mfa_enabled,
        mfa_method: mfa_method,
        last_mfa_setup_at: mfa_enabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (settingsError) {
      console.error('Error updating security settings:', settingsError);
      return NextResponse.json({ error: 'Failed to update MFA settings' }, { status: 500 });
    }

    // If disabling MFA, revoke any active verification codes
    if (!mfa_enabled) {
      await adminClient
        .from('mfa_verification_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('used_at', null);
    }

    return NextResponse.json({
      success: true,
      message: `MFA ${mfa_enabled ? 'enabled' : 'disabled'} for user`,
      settings: securitySettings,
    });

  } catch (error) {
    console.error('Toggle MFA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
