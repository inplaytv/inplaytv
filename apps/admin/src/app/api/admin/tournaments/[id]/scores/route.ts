import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const round = searchParams.get('round') || '1';

    // Fetch round scores with golfer details
    const { data: scores, error } = await supabase
      .from('tournament_round_scores')
      .select(`
        *,
        golfers (
          id,
          first_name,
          last_name,
          full_name
        )
      `)
      .eq('tournament_id', params.id)
      .eq('round_number', parseInt(round))
      .order('score', { ascending: true, nullsFirst: false });

    if (error) throw error;

    // Format scores with golfer names
    const formattedScores = scores?.map(score => ({
      id: score.id,
      golfer_id: score.golfer_id,
      golfer_name: score.golfers?.full_name || `${score.golfers?.first_name} ${score.golfers?.last_name}`,
      golfer_first_name: score.golfers?.first_name,
      golfer_last_name: score.golfers?.last_name,
      round_number: score.round_number,
      score: score.score,
      to_par: score.to_par,
      status: score.status || 'not_started',
      holes_completed: score.holes_completed || 0,
      data_source: score.data_source || 'unknown',
      is_manual_override: score.is_manual_override || false,
      updated_at: score.updated_at,
      notes: score.notes
    })) || [];

    return NextResponse.json({ scores: formattedScores });
  } catch (error: any) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}
