import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { amount_cents } = await request.json();
    
    // Validate amount (minimum £5)
    if (!amount_cents || amount_cents < 500) {
      return NextResponse.json(
        { error: 'Minimum withdrawal is £5' },
        { status: 400 }
      );
    }

    // Check user balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();
    
    if (!walletData || walletData.balance_cents < amount_cents) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Insert withdrawal request
    const { data: requestData, error: insertError } = await supabase
      .from('withdrawal_requests')
      .insert({
        user_id: user.id,
        amount_cents,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request_id: requestData.id,
    });
  } catch (error: any) {
    console.error('Withdrawal request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process withdrawal request' },
      { status: 500 }
    );
  }
}
