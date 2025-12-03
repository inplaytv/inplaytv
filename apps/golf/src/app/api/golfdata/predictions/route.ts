import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (tournamentId) {
      // Get predictions for specific tournament
      const { data: predictions, error: predError } = await supabase
        .from('tournament_predictions')
        .select(`
          *,
          golfer:golfers(id, name, country, image_url),
          tournament:tournaments(id, name, course_name, start_date, end_date)
        `)
        .eq('tournament_id', tournamentId)
        .order('win_probability', { ascending: false })
        .limit(limit);

      if (predError) throw predError;

      return NextResponse.json({
        predictions: predictions || [],
        tournament: predictions?.[0]?.tournament || null
      });
    } else {
      // Get all upcoming tournaments with top predictions
      const { data: tournaments, error: tourError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'upcoming')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10);

      if (tourError) throw tourError;

      // For each tournament, get top 5 predictions
      const tournamentsWithPredictions = await Promise.all(
        (tournaments || []).map(async (tournament) => {
          const { data: predictions } = await supabase
            .from('tournament_predictions')
            .select(`
              *,
              golfer:golfers(id, name, country, image_url)
            `)
            .eq('tournament_id', tournament.id)
            .order('win_probability', { ascending: false })
            .limit(5);

          return {
            ...tournament,
            topPredictions: predictions || []
          };
        })
      );

      return NextResponse.json({
        tournaments: tournamentsWithPredictions
      });
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
      { status: 500 }
    );
  }
}
