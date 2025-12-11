import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { createServerClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    // Only super admins can add new admins
    if (!currentAdmin.is_super_admin) {
      return NextResponse.json(
        { error: 'Forbidden - Super Admin access required to add admins' },
        { status: 403 }
      );
    }

    // Get email from request body
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to find user by email
    const { data: { users }, error: userSearchError } = await adminClient.auth.admin.listUsers();

    if (userSearchError) {
      throw userSearchError;
    }

    const targetUser = users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found with that email' },
        { status: 404 }
      );
    }

    // Check if user is already an admin using admin client
    const { data: existingAdmin } = await adminClient
      .from('admins')
      .select('user_id')
      .eq('user_id', targetUser.id)
      .single();

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      );
    }

    // Add user as admin using admin client
    const { data: newAdmin, error: insertError } = await adminClient
      .from('admins')
      .insert({ 
        user_id: targetUser.id,
        created_by: user.id,
        is_super_admin: false
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // TODO: Send confirmation email to new admin
    // This would notify them they've been granted admin access
    // and provide a link to set up their admin account

    return NextResponse.json({
      success: true,
      admin: {
        user_id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.user_metadata?.display_name || targetUser.user_metadata?.full_name || targetUser.email || 'N/A',
        is_super_admin: false,
        created_at: newAdmin.created_at
      },
      message: `${email} has been granted admin access`
    });

  } catch (error: any) {
    console.error('Error adding admin:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add admin' },
      { status: 500 }
    );
  }
}
