import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ playerId: string }> }
) {
  try {
    const { playerId } = await params;

    console.log('Fetching player data for ID:', playerId);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get player basic info
    const { data: golfer, error: golferError } = await supabase
      .from('golfers')
      .select('id, name, country, image_url')
      .eq('id', playerId)
      .single();

    console.log('Golfer query result:', { golfer, error: golferError });

    if (golferError || !golfer) {
      return NextResponse.json(
        { error: 'Player not found', details: golferError?.message },
        { status: 404 }
      );
    }

    // Get SG averages from materialized view
    const { data: sgAverages, error: sgError } = await supabase
      .from('player_sg_averages')
      .select('*')
      .eq('golfer_id', playerId)
      .single();

    if (sgError) {
      console.error('Error fetching SG averages:', sgError);
      return NextResponse.json(
        { error: 'No statistics available for this player' },
        { status: 404 }
      );
    }

    // Get recent rounds (last 20)
    const { data: rounds, error: roundsError } = await supabase
      .from('player_round_stats')
      .select('*')
      .eq('golfer_id', playerId)
      .order('event_date', { ascending: false })
      .limit(20);

    if (roundsError) {
      console.error('Error fetching rounds:', roundsError);
    }

    // Calculate form status
    const l5 = sgAverages.sg_total_l5 || 0;
    const l20 = sgAverages.sg_total_l20 || 0;
    const career = sgAverages.sg_total_career || 0;
    const momentum = l5 - l20;

    let formStatus: 'hot' | 'cold' | 'neutral' = 'neutral';
    if (l5 > career + 0.5) formStatus = 'hot';
    else if (l5 < career - 0.5) formStatus = 'cold';

    // Format response
    const playerData = {
      name: golfer.name,
      country: golfer.country,
      photoUrl: golfer.image_url,
      form: {
        status: formStatus,
        sgTotalL5: sgAverages.sg_total_l5 || 0,
        sgTotalL20: sgAverages.sg_total_l20 || 0,
        sgTotalCareer: sgAverages.sg_total_career || 0,
        momentum: Math.round(momentum * 1000) / 1000,
      },
      sgBreakdown: {
        l5: {
          ott: sgAverages.sg_ott_l5 || 0,
          app: sgAverages.sg_app_l5 || 0,
          arg: sgAverages.sg_arg_l5 || 0,
          putt: sgAverages.sg_putt_l5 || 0,
          t2g: (sgAverages.sg_ott_l5 || 0) + (sgAverages.sg_app_l5 || 0) + (sgAverages.sg_arg_l5 || 0),
        },
        l20: {
          ott: sgAverages.sg_ott_l20 || 0,
          app: sgAverages.sg_app_l20 || 0,
          arg: sgAverages.sg_arg_l20 || 0,
          putt: sgAverages.sg_putt_l20 || 0,
          t2g: (sgAverages.sg_ott_l20 || 0) + (sgAverages.sg_app_l20 || 0) + (sgAverages.sg_arg_l20 || 0),
        },
        career: {
          ott: sgAverages.sg_ott_career || 0,
          app: sgAverages.sg_app_career || 0,
          arg: sgAverages.sg_arg_career || 0,
          putt: sgAverages.sg_putt_career || 0,
          t2g: (sgAverages.sg_ott_career || 0) + (sgAverages.sg_app_career || 0) + (sgAverages.sg_arg_career || 0),
        },
      },
      recentRounds: rounds || [],
      totalRounds: sgAverages.total_rounds || 0,
      lastRoundDate: sgAverages.last_round_date,
    };

    return NextResponse.json(playerData);
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
