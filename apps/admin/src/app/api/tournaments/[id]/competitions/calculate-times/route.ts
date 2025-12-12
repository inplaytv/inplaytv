import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Constants
const REGISTRATION_CLOSE_BUFFER_MS = 15 * 60 * 1000; // 15 minutes before tee time
const DEBUG = process.env.NODE_ENV === 'development';

/**
 * POST /api/tournaments/[id]/competitions/calculate-times
 * Auto-calculate registration close times based on round tee times
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    if (DEBUG) console.log(`[Calculate Times] Processing tournament ${tournamentId}`);

    // 1. Fetch tournament with round tee times
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time, start_date')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('[Calculate Times] Tournament not found:', tournamentError);
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (DEBUG) {
      console.log('[Calculate Times] Tournament:', tournament.name);
      console.log('[Calculate Times] Round tee times:', {
        r1: tournament.round1_tee_time,
        r2: tournament.round2_tee_time,
        r3: tournament.round3_tee_time,
        r4: tournament.round4_tee_time,
      });
    }

    // 2. Fetch all competitions for this tournament
    const { data: competitions, error: competitionsError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        competition_type_id,
        competition_types!inner (
          id,
          name,
          slug,
          round_start
        )
      `)
      .eq('tournament_id', tournamentId);

    if (competitionsError) {
      console.error('[Calculate Times] Error fetching competitions:', competitionsError);
      return NextResponse.json(
        { error: 'Failed to fetch competitions' },
        { status: 500 }
      );
    }

    if (!competitions || competitions.length === 0) {
      if (DEBUG) console.log('[Calculate Times] No competitions found');
      return NextResponse.json({
        message: 'No competitions to update',
        updated: 0,
      });
    }

    if (DEBUG) console.log(`[Calculate Times] Found ${competitions.length} competitions`);

    // 3. Calculate registration close times for each competition
    const updates = [];
    const errors = [];
    const now = new Date();

    for (const comp of competitions) {
      const compType = (comp.competition_types as unknown) as { round_start: number; name: string };
      const roundStart = compType.round_start || 1; // Default to round 1
      
      if (DEBUG) {
        console.log(`[Calculate Times] Processing: ${compType.name}`);
        console.log(`[Calculate Times]   Starts at round: ${roundStart}`);
      }

      // Get the tee time for the round this competition starts on
      let teeTime: string | null = null;
      if (roundStart === 1) teeTime = tournament.round1_tee_time;
      else if (roundStart === 2) teeTime = tournament.round2_tee_time;
      else if (roundStart === 3) teeTime = tournament.round3_tee_time;
      else if (roundStart === 4) teeTime = tournament.round4_tee_time;

      if (!teeTime) {
        // No tee time set = round hasn't started yet = registration should be open
        if (DEBUG) console.log(`[Calculate Times]   ⚠️ No tee time for round ${roundStart}, setting to OPEN (round not started)`);
        updates.push({
          id: comp.id,
          name: compType.name,
          reg_close_at: null, // No close time yet
          status: 'reg_open',
        });
        continue;
      }

      // Calculate close time using constant buffer
      const teeTimeDate = new Date(teeTime);
      const regCloseAt = new Date(teeTimeDate.getTime() - REGISTRATION_CLOSE_BUFFER_MS);

      if (DEBUG) {
        console.log(`[Calculate Times]   Tee time: ${teeTime}`);
        console.log(`[Calculate Times]   Reg closes: ${regCloseAt.toISOString()}`);
      }

      // Calculate status based on current time
      let status = 'draft';
      
      if (now >= regCloseAt) {
        // Registration closed - competition is now live
        status = 'live';
      } else {
        // Registration still open
        status = 'reg_open';
      }

      if (DEBUG) console.log(`[Calculate Times]   Status: ${status} (${now >= regCloseAt ? 'registration closed' : 'registration open'})`);

      updates.push({
        id: comp.id,
        name: compType.name,
        reg_close_at: regCloseAt.toISOString(),
        status,
      });
    }

    // 4. Batch update all competitions
    console.log(`[Calculate Times] Updating ${updates.length} competitions...`);
    
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('tournament_competitions')
        .update({
          reg_close_at: update.reg_close_at,
          status: update.status,
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`[Calculate Times] Error updating ${update.name}:`, updateError);
      } else {
        console.log(`[Calculate Times] ✅ Updated ${update.name}: ${update.status}`);
      }
    }

    return NextResponse.json({
      message: 'Competition times calculated successfully',
      tournament: tournament.name,
      updated: updates.length,
      competitions: updates.map(u => ({
        name: u.name,
        reg_close_at: u.reg_close_at,
        status: u.status,
      })),
    });

  } catch (error) {
    console.error('[Calculate Times] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
