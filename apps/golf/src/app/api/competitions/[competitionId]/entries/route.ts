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

    // Creating new entry

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
    let isInstance = false;
    
    // Try tournament_competitions first (Regular Fantasy Golf - unlimited entries per user)
    const { data: compData, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        entry_fee_pennies,
        reg_close_at,
        competition_format,
        tournaments!tournament_competitions_tournament_id_fkey (
          start_date
        )
      `)
      .eq('id', competitionId)
      .maybeSingle();

    if (compData) {
      competition = compData;
      isInstance = false;
      // Regular Competition - Multiple entries allowed
    } else {
      // Try competition_instances (ONE 2 ONE - limit 1 entry per user)
      isInstance = true;
      
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
        console.log('🔍 ONE 2 ONE Instance status check:', { 
          instanceId: competitionId,
          currentStatus: instanceData.status,
          submissionStatus: status 
        });

        // ⚠️ ONE 2 ONE PROTECTION: Check if user already has an entry for THIS instance
        // ONE 2 ONE allows max 1 entry per user per competition
        const { data: existingEntry, error: existingError } = await supabase
          .from('competition_entries')
          .select('id')
          .eq('user_id', user.id)
          .eq('competition_id', competitionId)
          .maybeSingle();

        if (existingEntry) {
          console.log('[Entries] ❌ ONE 2 ONE DUPLICATE BLOCKED - User already has entry for this competition');
          return NextResponse.json(
            { error: 'You have already entered this ONE 2 ONE competition' },
            { status: 400 }
          );
        }

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
      // Processing payment for submitted entry
      
      // CRITICAL FIX: Use atomic SQL to prevent race conditions
      // This single UPDATE both checks balance AND deducts in one atomic operation
      // Using RPC function for PostgreSQL function that handles this atomically
      const { data: walletResult, error: deductError } = await supabase.rpc('deduct_from_wallet', {
        p_user_id: user.id,
        p_amount_cents: competition.entry_fee_pennies,
        p_reason: `Entry fee for ${entry_name || 'competition'}`
      });

      if (deductError) {
        console.error('❌ Wallet deduction failed:', deductError);
        if (deductError.message?.includes('Insufficient funds')) {
          throw new Error('Insufficient funds');
        }
        throw new Error('Failed to process payment: ' + deductError.message);
      }

      if (!walletResult || walletResult.success === false) {
        console.error('❌ Wallet deduction returned false');
        throw new Error('Insufficient funds');
      }

      // Wallet updated successfully
    }

    // NOW create the entry (only after payment succeeds)
// Creating competition entry
    
    const entryData: any = {
      user_id: user.id,
      competition_id: competitionId, // All entries use competition_id in unified schema
      entry_name,
      total_salary,
      entry_fee_paid: status === 'submitted' ? competition.entry_fee_pennies : 0,
      captain_golfer_id,
      status: status || 'draft',
      ...(status === 'submitted' && { submitted_at: new Date().toISOString() }),
    };
    
    // Entry data prepared
    
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

    // Entry created

    // For ONE 2 ONE competitions, update status to match player count
    if (competition.competition_format === 'one2one' && status === 'submitted') {
      console.log('🎯 ONE 2 ONE competition detected, checking player count...');
      
      // Check how many SUBMITTED entries exist for this competition (including the one just created)
      const { data: allEntries, error: countError } = await supabase
        .from('competition_entries')
        .select('id, user_id, created_at')
        .eq('competition_id', competitionId)
        .eq('status', 'submitted')
        .order('created_at', { ascending: true });

      if (!countError && allEntries) {
        const entryCount = allEntries.length;
        console.log(`📊 Total submitted entries for competition ${competitionId}: ${entryCount}`);

        // Use service role to bypass RLS for competition status update
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (entryCount === 1) {
          // First entry - activate the competition to 'open' with 1 player
          console.log('✅ First player joined - updating to OPEN');
          const { error: updateError } = await supabaseAdmin
            .from('tournament_competitions')
            .update({ 
              status: 'open',
              current_players: 1,
            })
            .eq('id', competitionId);
          
          if (updateError) {
            console.error('❌ Failed to update competition to open:', updateError);
          } else {
            console.log('✅ Competition status updated to OPEN');
          }
        } else if (entryCount >= 2) {
          // Second entry - mark competition as 'full' with 2 players
          console.log('🎉 Second player joined - updating to FULL');
          const { error: updateError } = await supabaseAdmin
            .from('tournament_competitions')
            .update({ 
              status: 'full',
              current_players: 2,
            })
            .eq('id', competitionId);
          
          if (updateError) {
            console.error('❌ Failed to update competition to full:', updateError);
          } else {
            console.log('✅ Competition status updated to FULL');
          }
        }
      } else if (countError) {
        console.error('❌ Error counting entries:', countError);
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
