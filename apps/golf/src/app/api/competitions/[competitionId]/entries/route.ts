import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST - Create new entry for a competition
export async function POST(
  request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entry_name, total_salary, captain_golfer_id, status, picks } = body;

    // Validate required fields
    if (total_salary === undefined || total_salary === null) {
      return NextResponse.json(
        { error: 'total_salary is required' },
        { status: 400 }
      );
    }

    // Validate status
    if (status && !['draft', 'submitted'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be draft or submitted.' },
        { status: 400 }
      );
    }

    // Get competition details for entry fee and validation
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        entry_fee_pennies,
        reg_close_at,
        tournaments!tournament_competitions_tournament_id_fkey (
          start_date
        )
      `)
      .eq('id', params.competitionId)
      .single();

    if (compError) throw compError;

    // CRITICAL SERVER-SIDE VALIDATION: Check if tournament has started
    const tournament: any = competition.tournaments;
    if (tournament?.start_date) {
      const now = new Date();
      const tournamentStart = new Date(tournament.start_date);
      if (now >= tournamentStart) {
        return NextResponse.json(
          { error: 'Registration is closed - tournament has already started' },
          { status: 403 }
        );
      }
    }

    // CRITICAL SERVER-SIDE VALIDATION: Check if registration deadline has passed
    if (competition.reg_close_at) {
      const now = new Date();
      const regClose = new Date(competition.reg_close_at);
      if (now >= regClose) {
        return NextResponse.json(
          { error: 'Registration is closed - deadline has passed' },
          { status: 403 }
        );
      }
    }

    // If status is submitted, deduct from wallet FIRST before creating entry
    if (status === 'submitted') {
      console.log('💰 Processing payment for submitted entry...');
      
      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance_cents')
        .eq('user_id', user.id)
        .single();

      if (walletError || !wallet) {
        console.error('❌ Wallet not found:', walletError);
        throw new Error('Wallet not found');
      }

      console.log('Current balance:', wallet.balance_cents, 'Entry fee:', competition.entry_fee_pennies);

      // Check sufficient balance
      if (wallet.balance_cents < competition.entry_fee_pennies) {
        console.error('❌ Insufficient funds');
        throw new Error('Insufficient funds');
      }

      // Deduct from wallet
      const newBalance = wallet.balance_cents - competition.entry_fee_pennies;
      console.log('💳 Deducting', competition.entry_fee_pennies, 'New balance will be:', newBalance);
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance_cents: newBalance })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Failed to update wallet:', updateError);
        throw updateError;
      }

      console.log('✅ Wallet updated successfully');

      // Create transaction record
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: user.id,
          change_cents: -competition.entry_fee_pennies,
          reason: `Entry fee for ${entry_name || 'competition'}`,
          balance_after_cents: newBalance,
        });

      if (txError) {
        console.error('⚠️ Transaction record failed (but payment succeeded):', txError);
        // Don't throw - payment already happened
      } else {
        console.log('✅ Transaction record created');
      }
    }

    // NOW create the entry (only after payment succeeds)
    console.log('📝 Creating competition entry...');
    
    const entryData = {
      user_id: user.id,
      competition_id: params.competitionId,
      entry_name,
      total_salary,
      entry_fee_paid: status === 'submitted' ? competition.entry_fee_pennies : 0,
      captain_golfer_id,
      status: status || 'draft',
      ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
    };
    
    console.log('📝 Entry data:', JSON.stringify(entryData, null, 2));
    
    const { data: newEntry, error: insertError } = await supabase
      .from('competition_entries')
      .insert(entryData)
      .select('id')
      .single();

    if (insertError) {
      console.error('❌ Entry creation failed:', insertError);
      console.error('❌ Failed entry data:', JSON.stringify(entryData, null, 2));
      console.error('⚠️ CRITICAL: Payment was taken but entry creation failed!');
      throw new Error(`Entry creation failed: ${insertError.message}. Please contact support - payment was processed.`);
    }

    if (!newEntry || !newEntry.id) {
      console.error('❌ Entry created but no ID returned');
      throw new Error('Entry creation failed - no ID returned');
    }

    console.log('✅ Entry created:', newEntry.id);

    // Insert picks if provided
    if (picks && picks.length > 0) {
      const picksToInsert = picks.map((pick: any) => ({
        entry_id: newEntry.id,
        golfer_id: pick.golfer_id,
        slot_position: pick.slot_position,
        salary_at_selection: pick.salary_at_selection,
      }));

      const { error: picksError } = await supabase
        .from('entry_picks')
        .insert(picksToInsert);

      if (picksError) throw picksError;
    }

    return NextResponse.json({
      success: true,
      entry_id: newEntry.id,
      message: status === 'submitted' ? 'Entry submitted successfully' : 'Draft created',
    });
  } catch (error: any) {
    console.error('POST entry error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to create entry' },
      { status: 500 }
    );
  }
}
