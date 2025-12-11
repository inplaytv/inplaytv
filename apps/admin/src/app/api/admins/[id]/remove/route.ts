import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify current user is an admin
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use admin client to check if current user is admin (bypasses RLS)
    const adminClient = createAdminClient();
    const { data: currentAdmin } = await adminClient
      .from('admins')
      .select('user_id, is_super_admin')
      .eq('user_id', user.id)
      .single();

    if (!currentAdmin) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Only super admins can remove admins
    if (!currentAdmin.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required to remove admins' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Check if target is a super admin
    const { data: targetAdmin } = await adminClient
      .from('admins')
      .select('user_id, is_super_admin')
      .eq('user_id', userId)
      .single();

    if (targetAdmin?.is_super_admin) {
      return NextResponse.json(
        { error: 'Cannot remove Super Admin accounts' },
        { status: 400 }
      );
    }

    // Prevent removing yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin access' },
        { status: 400 }
      );
    }

    // Remove admin using admin client
    const { error: deleteError } = await adminClient
      .from('admins')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: 'Admin access revoked successfully'
    });

  } catch (error: any) {
    console.error('Error removing admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove admin' },
      { status: 500 }
    );
  }
}
