import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/one-2-one/cron/cancel-unfilled
 * Cron job to cancel instances with < 2 players after reg_close_at
 * Should be called every minute by Vercel Cron or similar
 * Requires cron secret for security
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

    // Find instances that should be cancelled
    const now = new Date().toISOString();
    const { data: instances, error: instancesError } = await supabase
      .from('competition_instances')
      .select('*')
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
      return NextResponse.json({
        message: 'No instances to cancel',
        cancelled: 0,
        refunded: 0
      });
    }

    let cancelledCount = 0;
    let refundedCount = 0;
    const results = [];

    for (const instance of instances) {
      // Cancel the instance
      const cancellationReason = instance.current_players === 0
        ? 'No players joined'
        : 'Only 1 player joined - refunded';

      const { error: updateError } = await supabase
        .from('competition_instances')
        .update({
          status: 'cancelled',
          cancelled_at: now,
          cancellation_reason: cancellationReason
        })
        .eq('id', instance.id);

      if (updateError) {
        console.error(`Error cancelling instance ${instance.id}:`, updateError);
        results.push({
          instance_id: instance.id,
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
          .eq('instance_id', instance.id)
          .in('status', ['submitted', 'paid']);

        if (entriesError) {
          console.error(`Error fetching entries for instance ${instance.id}:`, entriesError);
          continue;
        }

        if (entries) {
          for (const entry of entries) {
            // Update entry status
            await supabase
              .from('competition_entries')
              .update({ status: 'cancelled' })
              .eq('id', entry.id);

            // Refund to wallet
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

              // Record transaction
              await supabase
                .from('wallet_transactions')
                .insert({
                  user_id: entry.user_id,
                  amount_pennies: entry.entry_fee_paid,
                  transaction_type: 'refund',
                  description: `ONE 2 ONE refund - match cancelled (insufficient players)`,
                  related_entry_id: entry.id
                });

              refundedCount++;
            }
          }
        }
      }

      results.push({
        instance_id: instance.id,
        instance_number: instance.instance_number,
        players: instance.current_players,
        status: 'cancelled',
        refunded: instance.current_players
      });
    }

    return NextResponse.json({
      message: `Processed ${instances.length} instances`,
      cancelled: cancelledCount,
      refunded: refundedCount,
      results
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/one-2-one/cron/cancel-unfilled:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
