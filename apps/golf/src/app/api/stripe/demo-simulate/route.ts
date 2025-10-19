import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Create secure server-side Supabase client (uses HTTP-only cookies)
    const supabase = await createServerClient();

    // Get authenticated user (secure - reads from HTTP-only cookies)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    // Parse request body
    const { amount_cents } = await request.json();
    
    // Validate amount
    if (!amount_cents || amount_cents < 100 || amount_cents > 1000000) {
      return NextResponse.json(
        { error: 'Invalid amount (must be between £1 and £10,000)' },
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

    // Generate unique provider_payment_id for demo
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const providerPaymentId = `demo:${user.id}:${timestamp}:${random}`;

    // Insert into wallet_external_payments table
    const { error: insertError } = await supabaseAdmin
      .from('wallet_external_payments')
      .insert({
        provider: 'demo',
        provider_payment_id: providerPaymentId,
        amount_cents,
        currency: 'GBP',
        user_id: user.id,
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
      reason: 'topup:demo',
      target_user_id: user.id,
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json({
      success: true,
      new_balance_cents: rpcData,
    });
  } catch (error: any) {
    console.error('Demo simulate error:', error);
    return NextResponse.json(
      { error: error.message || 'Demo simulation failed' },
      { status: 500 }
    );
  }
}
