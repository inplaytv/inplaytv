import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Safety net: Cancel challenges from tournaments that have completely ended
 * This is a fallback for edge cases where reg_close_at didn't trigger
 */
async function handleEndedTournamentInstances(supabase: any, now: string) {
  const { data: tournamentInstances, error: tournamentError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      instance_number,
      current_players,
      status,
      tournaments!inner (
        id,
        name,
        end_date,
        status
      )
    `)
    .eq('competition_format', 'one2one')
    .in('status', ['open', 'pending'])
    .lt('current_players', 2);

  let cancelledSafety = 0;
  let refundedSafety = 0;

  if (tournamentInstances && tournamentInstances.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const instance of tournamentInstances) {
      if (!instance.tournaments?.end_date) continue;
      
      const tournamentEnd = new Date(instance.tournaments.end_date);
      tournamentEnd.setHours(23, 59, 59, 999);

      if (today > tournamentEnd) {
        console.log(`⚠️  Safety net: Cancelling challenge ${instance.id} from ended tournament: ${instance.tournaments.name}`);

        await supabase
          .from('tournament_competitions')
          .update({
            status: 'cancelled',
            cancelled_at: now,
            cancellation_reason: 'Tournament ended (safety net refund)'
          })
          .eq('id', instance.id);

        cancelledSafety++;

        if (instance.current_players > 0) {
          const { data: entries } = await supabase
            .from('competition_entries')
            .select('id, user_id, entry_fee_paid')
            .eq('competition_id', instance.id)
            .in('status', ['submitted', 'paid']);

          if (entries) {
            for (const entry of entries) {
              await supabase
                .from('competition_entries')
                .update({ status: 'cancelled' })
                .eq('id', entry.id);

              const { data: wallet } = await supabase
                .from('wallets')
                .select('balance_pennies')
                .eq('user_id', entry.user_id)
                .single();

              if (wallet) {
                await supabase
                  .from('wallets')
                  .update({
                    balance_pennies: wallet.balance_pennies + entry.entry_fee_paid
                  })
                  .eq('user_id', entry.user_id);

                await supabase
                  .from('wallet_transactions')
                  .insert({
                    user_id: entry.user_id,
                    amount_pennies: entry.entry_fee_paid,
                    transaction_type: 'refund',
                    description: `ONE 2 ONE refund - tournament ended (safety net)`,
                    related_entry_id: entry.id
                  });

                refundedSafety++;
              }
            }
          }
        }
      }
    }
  }

  return { cancelledSafety, refundedSafety };
}

/**
 * POST /api/one-2-one/cron/cancel-unfilled
 * Cron job to:
 * 1. Delete 'pending' instances older than 30 minutes (abandoned team builders)
 * 2. Cancel 'open' instances with < 2 players after reg_close_at (PRIMARY REFUND TRIGGER)
 * 3. Cancel 'open' or 'pending' instances from tournaments that have ended (SAFETY NET)
 * Should be called every 1-5 minutes by Vercel Cron or similar
 * Requires cron secret for security
 * 
 * REFUND PRIORITY:
 * - Each ONE 2 ONE challenge has its own reg_close_at time
 * - Refunds happen when the challenge's registration closes, not when tournament ends
 * - Tournament end date is only a fallback for edge cases
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    // STEP 1: Delete abandoned 'pending' instances (older than 30 minutes)
    console.log('🧹 Cleaning up abandoned pending instances...');
    const { data: pendingInstances, error: pendingError } = await supabase
      .from('tournament_competitions')
      .select('id, instance_number, created_at')
      .eq('competition_format', 'one2one')
      .eq('status', 'pending')
      .lt('created_at', thirtyMinutesAgo);

    let deletedPending = 0;
    if (pendingInstances && pendingInstances.length > 0) {
      console.log(`Found ${pendingInstances.length} abandoned pending instances to delete`);
      
      for (const instance of pendingInstances) {
        const { error: deleteError } = await supabase
          .from('tournament_competitions')
          .delete()
          .eq('id', instance.id);
        
        if (!deleteError) {
          deletedPending++;
          console.log(`✅ Deleted pending instance ${instance.id} (created ${instance.created_at})`);
        } else {
          console.error(`❌ Failed to delete pending instance ${instance.id}:`, deleteError);
        }
      }
    }

    // STEP 2: Cancel 'open' instances past reg_close_at (PRIMARY REFUND TRIGGER)
    console.log('⏰ Checking for challenges past registration close time...');
    const { data: instances, error: instancesError } = await supabase
      .from('tournament_competitions')
      .select('*')
      .eq('competition_format', 'one2one')
      .eq('status', 'open')
      .lt('reg_close_at', now)
      .lt('current_players', 2);

    if (instancesError) {
      console.error('Error fetching instances to cancel:', instancesError);
      return NextResponse.json(
        { error: 'Failed to fetch instances' },
        { status: 500 }
      );
    }

    if (!instances || instances.length === 0) {
      console.log('No open instances past reg_close_at found');
    }

    let cancelledCount = 0;
    let refundedCount = 0;
    const results = [];

    for (const instance of instances) {
      const tournamentName = instance.tournaments?.name || 'Unknown';
      console.log(`🚫 Cancelling challenge ${instance.id} from ${tournamentName} (reg closed: ${instance.reg_close_at})`);
      
      // Cancel the instance
      const cancellationReason = instance.current_players === 0
        ? 'Registration closed - no players joined'
        : 'Registration closed - opponent not found';

      const { error: updateError } = await supabase
        .from('tournament_competitions')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancellation_reason: cancellationReason
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error(`Error cancelling competition ${instance.id}:`, updateError);
        results.push({
          competition_id: instance.id,
          status: 'error',
          error: updateError.message
        });
        continue;
      }

      cancelledCount++;

      // If there are players, refund them
      if (instance.current_players > 0) {
        // Get entries for this instance
        const { data: entries, error: entriesError } = await supabase
          .from('competition_entries')
          .select('id, user_id, entry_fee_paid')
          .eq('competition_id', instance.id)
          .in('status', ['submitted', 'paid']);

        if (entriesError) {
          console.error(`Error fetching entries for competition ${instance.id}:`, entriesError);
          continue;
        }

        if (entries) {
          for (const entry of entries) {
            // Update entry status
            await supabase
              .from('competition_entries')
              .update({ status: 'cancelled' })
              .eq('id', entry.id);

            // Refund to wallet using wallet_apply RPC
            const { error: refundError } = await supabase.rpc('wallet_apply', {
              change_cents: entry.entry_fee_paid,
              reason: `Refund: ONE 2 ONE challenge cancelled - registration closed without opponent`,
              target_user_id: entry.user_id
            });

            if (!refundError) {
              refundedCount++;
              console.log(`💰 Refunded ${entry.entry_fee_paid} pennies to user ${entry.user_id}`);
            } else {
              console.error(`❌ Failed to refund user ${entry.user_id}:`, refundError);
            }
          }
        }
      }

      results.push({
        competition_id: instance.id,
        instance_number: instance.instance_number,
        players: instance.current_players,
        status: 'cancelled',
        refunded: instance.current_players,
        reason: 'Registration closed'
      });
    }

    // STEP 3: Safety net - check for challenges from tournaments that have ended
    console.log('🏆 Safety check: Looking for challenges from ended tournaments...');
    const { cancelledSafety, refundedSafety } = await handleEndedTournamentInstances(supabase, now);

    return NextResponse.json({
      message: `Cleanup complete`,
      deletedPending: deletedPending,
      cancelledByRegClose: cancelledCount,
      refundedByRegClose: refundedCount,
      cancelledSafetyNet: cancelledSafety,
      refundedSafetyNet: refundedSafety,
      note: 'Primary refund trigger is reg_close_at (step 2). Tournament end (step 3) is fallback only.'
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/one-2-one/cron/cancel-unfilled:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
