import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// POST - Create new entry for a competition
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entry_name, total_salary, captain_golfer_id, status, picks } = body;

    console.log('[Entries] 🔍 DUPLICATE CHECK v2 - Checking for existing entries for user:', user.id, 'competition:', competitionId);

    // CRITICAL: Check if user already has an entry for THIS SPECIFIC competition/instance
    // Must check the exact instance_id or competition_id match
    const { data: existingEntries, error: existingError } = await supabase
      .from('competition_entries')
      .select('id, status, instance_id, competition_id')
      .eq('user_id', user.id)
      .or(`competition_id.eq.${competitionId},instance_id.eq.${competitionId}`);

    if (existingError) {
      console.error('[Entries] Error checking for existing entry:', existingError);
    }

    // Check if ANY of the entries match THIS specific instance/competition
    const duplicateEntry = existingEntries?.find(entry => 
      entry.instance_id === competitionId || entry.competition_id === competitionId
    );

    if (duplicateEntry) {
      console.log('[Entries] ❌ DUPLICATE BLOCKED:', {
        existingEntryId: duplicateEntry.id,
        forInstance: duplicateEntry.instance_id,
        forCompetition: duplicateEntry.competition_id,
        attemptingToEnter: competitionId
      });
      return NextResponse.json(
        { error: 'You have already entered this competition' },
        { status: 400 }
      );
    }
    
    if (existingEntries && existingEntries.length > 0) {
      console.log('[Entries] ✅ User has other entries but not for THIS instance:', {
        totalEntries: existingEntries.length,
        checkingInstance: competitionId
      });
    }

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

    // Get competition details for entry fee and validation (supports both tournament_competitions AND competition_instances)
    let competition: any = null;
    
    // Try tournament_competitions first
    const { data: compData, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        entry_fee_pennies,
        reg_close_at,
        tournaments!tournament_competitions_tournament_id_fkey (
          start_date
        )
      `)
      .eq('id', competitionId)
      .maybeSingle();

    if (compData) {
      competition = compData;
    } else {
      // Try competition_instances (ONE 2 ONE)
      const { data: instanceData, error: instanceError } = await supabase
        .from('competition_instances')
        .select(`
          reg_close_at,
          start_at,
          tournament_id,
          status,
          entry_fee_pennies,
          competition_templates!competition_instances_template_id_fkey (
            entry_fee_pennies
          ),
          tournaments!competition_instances_tournament_id_fkey (
            start_date
          )
        `)
        .eq('id', competitionId)
        .maybeSingle();

      if (instanceData) {
        console.log('🔍 Instance status check:', { 
          instanceId: competitionId,
          currentStatus: instanceData.status,
          submissionStatus: status 
        });

        const template: any = instanceData.competition_templates;
        const tournament: any = instanceData.tournaments;
        competition = {
          entry_fee_pennies: instanceData.entry_fee_pennies || template?.entry_fee_pennies || 0,
          reg_close_at: instanceData.reg_close_at,
          tournaments: tournament,
        };
      }
    }

    if (!competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // CRITICAL SERVER-SIDE VALIDATION: Check if registration deadline has passed
    // This is the ONLY check needed - reg_close_at is already set appropriately for each competition type
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
    
    // Determine if this is a ONE 2 ONE instance (instance_id should be set)
    const isInstance = !compData; // If we didn't find it in tournament_competitions, it's an instance
    console.log('[Entries] Competition type:', isInstance ? 'ONE 2 ONE Instance' : 'Regular Competition');
    console.log('[Entries] Competition ID:', competitionId);
    
    const entryData: any = {
      user_id: user.id,
      competition_id: isInstance ? null : competitionId, // NULL for instances
      instance_id: isInstance ? competitionId : null, // Set instance_id for ONE 2 ONE
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

    // If ONE 2 ONE instance and submitted, manage current_players count
    if (isInstance && status === 'submitted') {
      console.log('[Entries] Managing ONE 2 ONE instance players for:', competitionId);
      
      // Check how many SUBMITTED entries exist for this instance (including the one just created)
      const { data: allEntries, error: countError } = await supabase
        .from('competition_entries')
        .select('id, user_id, created_at')
        .eq('instance_id', competitionId)
        .eq('status', 'submitted')
        .order('created_at', { ascending: true });

      if (countError) {
        console.error('[Entries] Error fetching entries:', countError);
      } else if (allEntries) {
        const entryCount = allEntries.length;
        console.log('[Entries] Total submitted entries:', entryCount);
        console.log('[Entries] Entry details:', allEntries.map(e => ({ user_id: e.user_id, created_at: e.created_at })));

        if (entryCount === 1) {
          // First entry - activate the instance to 'open' with 1 player
          console.log('[Entries] First player submission - activating instance to open');
          const { error: activateError } = await supabase
            .from('competition_instances')
            .update({ 
              status: 'open',
              current_players: 1,
            })
            .eq('id', competitionId);
          
          if (activateError) {
            console.error('[Entries] ❌ Failed to activate instance:', activateError);
          } else {
            console.log('[Entries] ✅ Instance activated to open with 1 player');
          }
        } else if (entryCount === 2) {
          // Second entry - mark instance as 'full' with 2 players
          console.log('[Entries] Second player submission - marking instance as full');
          
          // Use service role to bypass RLS for instance status update
          const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );
          
          const { data: updateResult, error: updateError } = await supabaseAdmin
            .from('competition_instances')
            .update({ 
              status: 'full',
              current_players: 2,
            })
            .eq('id', competitionId)
            .select();
          
          if (updateError) {
            console.error('[Entries] ❌ Failed to mark instance as full:', updateError);
          } else {
            console.log('[Entries] ✅ Instance update result:', updateResult);
            console.log('[Entries] ✅ Rows updated:', updateResult?.length);
          }
        } else {
          console.warn('[Entries] ⚠️ Unexpected entry count:', entryCount, '(expected 1 or 2)');
        }
      }
    }

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
