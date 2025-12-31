import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

// GET /api/tournaments/[slug]/leaderboard - Fetch live tournament leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tournament details by slug or ID
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date, reg_close_at, timezone, round_1_start, round_2_start, round_3_start, round_4_start')
      .or(`slug.eq.${slug},id.eq.${slug}`)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', tournamentError);
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Fetch golfers with scores (including hole-by-hole data)
    const { data: golfers, error: golfersError } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        r1_score,
        r2_score,
        r3_score,
        r4_score,
        r1_holes,
        r2_holes,
        r3_holes,
        r4_holes,
        total_score,
        position,
        golfers (
          id,
          first_name,
          last_name,
          name,
          country
        )
      `)
      .eq('tournament_id', tournament.id)
      .order('total_score', { ascending: true, nullsFirst: false });

    if (golfersError) {
      console.error('❌ Error fetching golfers:', golfersError);
      return NextResponse.json({ error: 'Failed to fetch golfers' }, { status: 500 });
    }

    // Format the leaderboard data
    const leaderboard = (golfers || []).map((tg: any) => {
      const golfer = tg.golfers;
      const rounds = [tg.r1_score, tg.r2_score, tg.r3_score, tg.r4_score].filter(s => s !== null);
      const todayScore = rounds.length > 0 ? rounds[rounds.length - 1] : 0;
      
      // Determine "thru" status
      let thru = 'F';
      if (!tg.r4_score && tg.r3_score !== null) thru = 'R3';
      else if (!tg.r3_score && tg.r2_score !== null) thru = 'R2';
      else if (!tg.r2_score && tg.r1_score !== null) thru = 'R1';
      
      return {
        id: golfer.id,
        name: golfer.name || `${golfer.first_name} ${golfer.last_name}`,
        country: golfer.country,
        position: tg.position || '-',
        score: tg.total_score || 0,
        today: todayScore || 0,
        thru,
        rounds: [
          tg.r1_score,
          tg.r2_score,
          tg.r3_score,
          tg.r4_score,
        ].filter(r => r !== null),
        // Include hole-by-hole data if available
        r1_holes: tg.r1_holes || null,
        r2_holes: tg.r2_holes || null,
        r3_holes: tg.r3_holes || null,
        r4_holes: tg.r4_holes || null,
        // Also include raw round scores for compatibility
        r1: tg.r1_score,
        r2: tg.r2_score,
        r3: tg.r3_score,
        r4: tg.r4_score
      };
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        reg_close_at: tournament.reg_close_at,
        timezone: tournament.timezone,
        round1_tee_time: tournament.round_1_start,
        round2_tee_time: tournament.round_2_start,
        round3_tee_time: tournament.round_3_start,
        round4_tee_time: tournament.round_4_start
      },
      leaderboard,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Tournament leaderboard error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
