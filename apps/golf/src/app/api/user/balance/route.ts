import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch user's wallet balance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();

    if (walletError) {
      // If wallet doesn't exist, return 0 balance
      if (walletError.code === 'PGRST116') {
        return NextResponse.json({ 
          balance_pennies: 0,
          balance_cents: 0 
        });
      }
      throw walletError;
    }

    // Return balance in pennies (UK) - same as cents
    return NextResponse.json({ 
      balance_pennies: wallet?.balance_cents || 0,
      balance_cents: wallet?.balance_cents || 0
    });

  } catch (error: any) {
    console.error('Fetch balance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
