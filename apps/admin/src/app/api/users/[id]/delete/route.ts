import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const userId = params.id;
    const adminClient = createAdminClient();

    // First, delete user from Supabase Auth
    // This will cascade to profiles and wallets if foreign keys are set up properly
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Explicitly delete from profiles table (in case cascade isn't configured)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Don't return error since auth deletion succeeded
    }

    // Explicitly delete from wallets table (in case cascade isn't configured)
    const { error: walletError } = await adminClient
      .from('wallets')
      .delete()
      .eq('user_id', userId);

    if (walletError) {
      console.error('Error deleting wallet:', walletError);
      // Don't return error since auth deletion succeeded
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User account deleted permanently' 
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
