import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface PlayerSGHistory {
  playerId: string;
  playerName: string;
  totalRounds: number;
  rounds: Array<{
    date: string;
    tournamentName: string;
    tournamentId: string;
    roundNumber: number;
    score: number;
    toPar: number;
    coursePar: number;
    sg: {
      total: number | null;
      ott: number | null;
      app: number | null;
      arg: number | null;
      putt: number | null;
      t2g: number | null;
    };
  }>;
  averages: {
    last5: SGAverages;
    last10: SGAverages;
    last20: SGAverages;
    career: SGAverages;
  };
  form: {
    status: 'hot' | 'cold' | 'neutral';
    momentum: number;
  };
}

interface SGAverages {
  total: number | null;
  ott: number | null;
  app: number | null;
  arg: number | null;
  putt: number | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'l20'; // l5, l10, l20, all
    const limit = parseInt(searchParams.get('limit') || '20');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get player info
    const { data: player, error: playerError } = await supabase
      .from('golfers')
      .select('id, name')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Get round history with tournament details
    const { data: rounds, error: roundsError } = await supabase
      .from('player_round_stats')
      .select(`
        event_date,
        round_number,
        score,
        to_par,
        course_par,
        sg_total,
        sg_ott,
        sg_app,
        sg_arg,
        sg_putt,
        sg_t2g,
        tournament:tournaments!tournament_id (
          id,
          name
        )
      `)
      .eq('golfer_id', playerId)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
      return NextResponse.json(
        { error: 'Failed to fetch round history' },
        { status: 500 }
      );
    }

    // Get player averages
    const { data: averages, error: avgError } = await supabase
      .from('player_sg_averages')
      .select('*')
      .eq('golfer_id', playerId)
      .single();

    if (avgError) {
      console.error('Error fetching averages:', avgError);
    }

    // Calculate form status
    const formStatus = calculateFormStatus(averages);

    // Format response
    const response: PlayerSGHistory = {
      playerId: player.id,
      playerName: player.name,
      totalRounds: averages?.total_rounds || 0,
      rounds: (rounds || []).map((r: any) => ({
        date: r.event_date,
        tournamentName: r.tournament?.name || 'Unknown',
        tournamentId: r.tournament?.id || '',
        roundNumber: r.round_number,
        score: r.score,
        toPar: r.to_par,
        coursePar: r.course_par,
        sg: {
          total: r.sg_total,
          ott: r.sg_ott,
          app: r.sg_app,
          arg: r.sg_arg,
          putt: r.sg_putt,
          t2g: r.sg_t2g,
        },
      })),
      averages: {
        last5: {
          total: averages?.sg_total_l5 || null,
          ott: averages?.sg_ott_l5 || null,
          app: averages?.sg_app_l5 || null,
          arg: averages?.sg_arg_l5 || null,
          putt: averages?.sg_putt_l5 || null,
        },
        last10: {
          total: averages?.sg_total_l10 || null,
          ott: averages?.sg_ott_l10 || null,
          app: averages?.sg_app_l10 || null,
          arg: averages?.sg_arg_l10 || null,
          putt: averages?.sg_putt_l10 || null,
        },
        last20: {
          total: averages?.sg_total_l20 || null,
          ott: averages?.sg_ott_l20 || null,
          app: averages?.sg_app_l20 || null,
          arg: averages?.sg_arg_l20 || null,
          putt: averages?.sg_putt_l20 || null,
        },
        career: {
          total: averages?.sg_total_career || null,
          ott: averages?.sg_ott_career || null,
          app: averages?.sg_app_career || null,
          arg: averages?.sg_arg_career || null,
          putt: averages?.sg_putt_career || null,
        },
      },
      form: formStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateFormStatus(averages: any): {
  status: 'hot' | 'cold' | 'neutral';
  momentum: number;
} {
  if (!averages) {
    return { status: 'neutral', momentum: 0 };
  }

  const l5 = averages.sg_total_l5 || 0;
  const career = averages.sg_total_career || 0;
  const l20 = averages.sg_total_l20 || 0;

  // Calculate momentum (l5 vs l20)
  const momentum = l5 - l20;

  // Determine form status
  let status: 'hot' | 'cold' | 'neutral' = 'neutral';
  
  if (l5 > career + 0.5) {
    status = 'hot';
  } else if (l5 < career - 0.5) {
    status = 'cold';
  }

  return {
    status,
    momentum: Math.round(momentum * 1000) / 1000,
  };
}
