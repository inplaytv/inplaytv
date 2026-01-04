import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    const body = await request.json();
    const { user_id, amount, reason } = body;

    console.log('🔍 Grant credits request:', { user_id, amount, reason });

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'amount is required' }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ error: 'reason is required' }, { status: 400 });
    }

    // Call the RPC function to apply credits atomically
    const { data, error } = await supabaseAdmin.rpc('apply_clubhouse_credits', {
      p_user_id: user_id,
      p_amount: amount,
      p_reason: reason,
      p_reference_id: null,
    });

    console.log('✅ RPC result:', { data, error });

    if (error) {
      console.error('Error applying credits:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to apply credits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      new_balance: data,
      message: `${amount > 0 ? 'Granted' : 'Deducted'} ${Math.abs(amount)} credits`,
    });
  } catch (error: any) {
    console.error('Error in grant-credits API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
