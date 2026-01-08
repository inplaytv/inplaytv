import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient();
    const competitionId = params.id;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get competition details
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('entry_fee_pennies, tournament_id, status')
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Check if user already has an entry
    const { data: existingEntry } = await supabase
      .from('competition_entries')
      .select('id')
      .eq('competition_id', competitionId)
      .eq('user_id', user.id)
      .single();

    if (existingEntry) {
      return NextResponse.json({ error: 'You already have an entry for this competition' }, { status: 400 });
    }

    // Check wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();

    if (!wallet || wallet.balance_cents < competition.entry_fee_pennies) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
    }

    // Deduct entry fee from wallet
    const { error: deductError } = await supabase.rpc('deduct_from_wallet', {
      p_user_id: user.id,
      p_amount_cents: competition.entry_fee_pennies,
      p_reason: `Reserved place in competition ${competitionId}`
    });

    if (deductError) {
      if (deductError.message?.includes('Insufficient funds')) {
        return NextResponse.json({ error: 'Insufficient funds' }, { status: 402 });
      }
      throw deductError;
    }

    // Create entry with 'pending_lineup' status (user has paid but hasn't picked golfers yet)
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .insert({
        competition_id: competitionId,
        user_id: user.id,
        entry_fee_paid: competition.entry_fee_pennies,
        status: 'pending_lineup', // Special status for reservations
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (entryError) {
      // Refund the entry fee if entry creation fails
      await supabase.rpc('wallet_apply', {
        change_cents: competition.entry_fee_pennies,
        reason: `Refund: Failed to create entry for competition ${competitionId}`,
        target_user_id: user.id
      });
      throw entryError;
    }

    return NextResponse.json({
      success: true,
      entry: entry,
      message: 'Place reserved successfully! You\'ll be notified when the golfer lineup is available.'
    });
  } catch (error: any) {
    console.error('Error reserving place:', error);
    return NextResponse.json({ error: error.message || 'Failed to reserve place' }, { status: 500 });
  }
}
