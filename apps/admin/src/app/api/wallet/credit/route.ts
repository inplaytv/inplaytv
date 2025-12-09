import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create secure server-side Supabase client
    const supabase = await createServerClient();

    // Get authenticated admin user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Verify user is admin using RPC function
    const userIsAdmin = await isAdmin(user.id);
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const { user_id, amount_cents, reason } = await request.json();
    
    // Validate inputs
    if (!user_id || !amount_cents) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id and amount_cents' },
        { status: 400 }
      );
    }

    if (amount_cents < 100 || amount_cents > 100000000) {
      return NextResponse.json(
        { error: 'Invalid amount (must be between £1 and £1,000,000)' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client with service role key
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify target user exists
    const { data: targetUser, error: targetUserError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, username')
      .eq('id', user_id)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate unique provider_payment_id for admin credit
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const providerPaymentId = `admin:${user.id}:${user_id}:${timestamp}:${random}`;

    // Insert into wallet_external_payments table
    const { error: insertError } = await supabaseAdmin
      .from('wallet_external_payments')
      .insert({
        provider: 'admin',
        provider_payment_id: providerPaymentId,
        amount_cents,
        currency: 'GBP',
        user_id: user_id,
        status: 'completed',
      });

    // If unique violation, this payment already processed (idempotent)
    if (insertError && insertError.code === '23505') {
      return NextResponse.json({ 
        success: true, 
        message: 'Payment already processed',
      });
    }

    if (insertError) {
      throw insertError;
    }

    // Call wallet_apply RPC to credit the wallet
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('wallet_apply', {
      change_cents: amount_cents,
      reason: reason || 'admin_credit',
      target_user_id: user_id,
    });

    if (rpcError) {
      throw rpcError;
    }

    // Get updated balance
    const { data: walletData } = await supabaseAdmin
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user_id)
      .single();

    return NextResponse.json({ 
      success: true, 
      message: `Successfully credited £${(amount_cents / 100).toFixed(2)} to ${targetUser.username || targetUser.email}`,
      new_balance_cents: walletData?.balance_cents || 0,
      credited_by: user.email,
    });

  } catch (error: any) {
    console.error('Admin wallet credit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to credit wallet' },
      { status: 500 }
    );
  }
}
