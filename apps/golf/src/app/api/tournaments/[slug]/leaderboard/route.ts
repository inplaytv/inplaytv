import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

// GET /api/tournaments/[slug]/leaderboard - Fetch live tournament leaderboard
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log('🏌️ Fetching leaderboard for tournament slug:', params.slug);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tournament details by slug or ID
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, status, start_date, end_date, reg_close_at, timezone, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time')
      .or(`slug.eq.${params.slug},id.eq.${params.slug}`)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', tournamentError);
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Fetch golfers with scores
    const { data: golfers, error: golfersError } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        r1_score,
        r2_score,
        r3_score,
        r4_score,
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

    console.log('✅ Found', golfers?.length || 0, 'golfers');

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
          tg.r1_score !== null ? tg.r1_score + 72 : null,
          tg.r2_score !== null ? tg.r2_score + 72 : null,
          tg.r3_score !== null ? tg.r3_score + 72 : null,
          tg.r4_score !== null ? tg.r4_score + 72 : null,
        ].filter(r => r !== null)
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
        round1_tee_time: tournament.round1_tee_time,
        round2_tee_time: tournament.round2_tee_time,
        round3_tee_time: tournament.round3_tee_time,
        round4_tee_time: tournament.round4_tee_time
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
