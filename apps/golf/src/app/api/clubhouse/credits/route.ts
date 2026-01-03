import { createClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, amount, reason } = await request.json();

    if (!userId || !amount || !reason) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, amount, reason' 
      }, { status: 400 });
    }

    const supabase = createClient();

    // Use atomic RPC function to grant credits (no auth check for now - development)
    const { data: newBalance, error: grantError } = await supabase.rpc('grant_credits', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason
    });

    if (grantError) {
      console.error('Credit grant failed:', grantError);
      return NextResponse.json({ 
        error: 'Failed to grant credits',
        details: grantError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newBalance,
      message: `${amount} credits granted successfully`
    });

  } catch (error: any) {
    console.error('Error granting credits:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

// GET endpoint to check wallet balance
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const supabase = createClient();

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('clubhouse_wallets')
      .select('credits, updated_at')
      .eq('user_id', userId)
      .single();

    if (walletError) {
      // Wallet doesn't exist yet
      return NextResponse.json({
        credits: 0,
        updated_at: new Date().toISOString()
      });
    }

    return NextResponse.json({
      credits: wallet.credits,
      updated_at: wallet.updated_at
    });

  } catch (error: any) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
