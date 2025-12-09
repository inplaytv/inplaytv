import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/one-2-one/instances/[instanceId]/join
 * Join a ONE 2 ONE instance with a team
 * Body: { golfer_ids: string[], captain_golfer_id: string, entry_name?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authSupabase = await createServerClient();
    const { instanceId } = await params;
    
    // Get authenticated user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { golfer_ids, captain_golfer_id, entry_name } = body;

    if (!golfer_ids || !Array.isArray(golfer_ids) || golfer_ids.length === 0) {
      return NextResponse.json(
        { error: 'golfer_ids array is required' },
        { status: 400 }
      );
    }

    if (!captain_golfer_id) {
      return NextResponse.json(
        { error: 'captain_golfer_id is required' },
        { status: 400 }
      );
    }

    // Get instance details with template
    const { data: instance, error: instanceError } = await supabase
      .from('competition_instances')
      .select(`
        *,
        template:competition_templates (*)
      `)
      .eq('id', instanceId)
      .single();

    if (instanceError || !instance) {
      return NextResponse.json(
        { error: 'Instance not found' },
        { status: 404 }
      );
    }

    // Check if instance is open
    if (instance.status !== 'open') {
      return NextResponse.json(
        { error: 'This match is no longer accepting players' },
        { status: 403 }
      );
    }

    // Check if already full
    if (instance.current_players >= instance.max_players) {
      return NextResponse.json(
        { error: 'This match is full' },
        { status: 403 }
      );
    }

    // Check registration deadline
    if (instance.reg_close_at) {
      const now = new Date();
      const closeDate = new Date(instance.reg_close_at);
      if (now >= closeDate) {
        return NextResponse.json(
          { error: 'Registration is closed for this match' },
          { status: 403 }
        );
      }
    }

    // Check if user is the challenge creator (first entry)
    const { data: creatorEntry, error: creatorError } = await supabase
      .from('competition_entries')
      .select('user_id')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!creatorError && creatorEntry?.user_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot accept your own challenge' },
        { status: 403 }
      );
    }

    // Check if user already joined this instance
    const { data: existingEntry, error: existingError } = await supabase
      .from('competition_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('instance_id', instanceId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing entry:', existingError);
      return NextResponse.json(
        { error: 'Failed to check existing entry' },
        { status: 500 }
      );
    }

    if (existingEntry) {
      return NextResponse.json(
        { error: 'You have already joined this match' },
        { status: 403 }
      );
    }

    // Get golfer salaries for the tournament
    const { data: golfers, error: golfersError } = await supabase
      .from('competition_golfers')
      .select('golfer_id, salary')
      .eq('tournament_id', instance.tournament_id)
      .in('golfer_id', golfer_ids);

    if (golfersError || !golfers) {
      console.error('Error fetching golfers:', golfersError);
      return NextResponse.json(
        { error: 'Failed to fetch golfer data' },
        { status: 500 }
      );
    }

    // Validate all golfers exist
    if (golfers.length !== golfer_ids.length) {
      return NextResponse.json(
        { error: 'Some golfers are not available for this tournament' },
        { status: 400 }
      );
    }

    // Calculate total salary
    const totalSalary = golfers.reduce((sum, g) => sum + (g.salary || 0), 0);

    // Validate salary cap (£60,000)
    const SALARY_CAP = 60000;
    if (totalSalary > SALARY_CAP) {
      return NextResponse.json(
        { error: `Team exceeds salary cap of £${SALARY_CAP.toLocaleString()}` },
        { status: 400 }
      );
    }

    // Get user's wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance_pennies')
      .eq('user_id', user.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    // Check if user has enough balance
    const entryFee = instance.template.entry_fee_pennies || 0;
    if (wallet.balance_pennies < entryFee) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 402 }
      );
    }

    // Start transaction: Create entry, add picks, deduct wallet
    // Note: Supabase doesn't support multi-statement transactions via REST API
    // We'll do sequential operations and handle rollback if needed

    // 1. Create competition entry
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .insert({
        user_id: user.id,
        competition_id: instance.tournament_id, // Link to tournament for compatibility
        instance_id: instanceId,
        entry_name: entry_name || `${user.email?.split('@')[0]}'s Team`,
        total_salary: totalSalary,
        entry_fee_paid: entryFee,
        captain_golfer_id: captain_golfer_id,
        status: 'paid' // Since we're deducting from wallet immediately
      })
      .select()
      .single();

    if (entryError) {
      console.error('Error creating entry:', entryError);
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      );
    }

    // 2. Add picks
    const picks = golfer_ids.map(golferId => ({
      entry_id: entry.id,
      golfer_id: golferId,
      salary_at_pick: golfers.find(g => g.golfer_id === golferId)?.salary || 0
    }));

    const { error: picksError } = await supabase
      .from('entry_picks')
      .insert(picks);

    if (picksError) {
      console.error('Error adding picks:', picksError);
      // Rollback: Delete entry
      await supabase
        .from('competition_entries')
        .delete()
        .eq('id', entry.id);
      
      return NextResponse.json(
        { error: 'Failed to add golfers to entry' },
        { status: 500 }
      );
    }

    // 3. Deduct from wallet
    const { error: walletError2 } = await supabase
      .from('wallets')
      .update({
        balance_pennies: wallet.balance_pennies - entryFee
      })
      .eq('user_id', user.id);

    if (walletError2) {
      console.error('Error updating wallet:', walletError2);
      // Rollback: Delete picks and entry
      await supabase.from('entry_picks').delete().eq('entry_id', entry.id);
      await supabase.from('competition_entries').delete().eq('id', entry.id);
      
      return NextResponse.json(
        { error: 'Failed to process payment' },
        { status: 500 }
      );
    }

    // 4. Record transaction
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: user.id,
        amount_pennies: -entryFee,
        transaction_type: 'entry_fee',
        description: `ONE 2 ONE entry: ${instance.template.short_name}`,
        related_entry_id: entry.id
      });

    // The trigger will automatically update instance.current_players
    // and status to 'full' if this is the 2nd player

    // Get updated instance to return
    const { data: updatedInstance } = await supabase
      .from('competition_instances')
      .select('*')
      .eq('id', instanceId)
      .single();

    return NextResponse.json({
      success: true,
      entry: entry,
      instance: updatedInstance,
      message: updatedInstance?.status === 'full' 
        ? 'Match is now full! Good luck!'
        : 'Waiting for opponent to join...'
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/one-2-one/instances/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
