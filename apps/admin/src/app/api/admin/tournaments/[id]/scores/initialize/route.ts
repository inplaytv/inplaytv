// ============================================================================
// Initialize Tournament Scores API
// ============================================================================
// POST /api/admin/tournaments/[id]/scores/initialize
// Purpose: Create blank score entries for all golfers to enable manual entry
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    const body = await request.json();
    const { round } = body;

    if (!round || round < 1 || round > 4) {
      return NextResponse.json(
        { error: 'Invalid round number. Must be 1-4.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get all golfers in this tournament
    const { data: tournamentGolfers, error: golfersError } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        golfers:golfer_id (
          id,
          full_name,
          first_name,
          last_name
        )
      `)
      .eq('tournament_id', tournamentId);

    if (golfersError || !tournamentGolfers) {
      console.error('Error fetching golfers:', golfersError);
      return NextResponse.json(
        { error: 'Failed to fetch tournament golfers' },
        { status: 500 }
      );
    }

    if (tournamentGolfers.length === 0) {
      return NextResponse.json(
        { error: 'No golfers found in this tournament. Please add golfers first via "Manage Golfers".' },
        { status: 400 }
      );
    }

    // Check how many already have scores for this round
    const { data: existingScores } = await supabase
      .from('tournament_round_scores')
      .select('golfer_id')
      .eq('tournament_id', tournamentId)
      .eq('round_number', round);

    const existingGolferIds = new Set(existingScores?.map(s => s.golfer_id) || []);
    
    // Create blank score entries for golfers who don't have one yet
    const scoresToCreate = tournamentGolfers
      .filter(tg => !existingGolferIds.has(tg.golfer_id))
      .map(tg => ({
        tournament_id: tournamentId,
        golfer_id: tg.golfer_id,
        round_number: round,
        score: null,
        to_par: null,
        status: 'not_started',
        holes_completed: 0,
        data_source: 'manual',
        is_manual_override: false,
        notes: 'Initialized for manual entry'
      }));

    if (scoresToCreate.length === 0) {
      return NextResponse.json({
        message: 'All golfers already have score entries for this round',
        count: 0
      });
    }

    // Insert the blank scores
    const { error: insertError } = await supabase
      .from('tournament_round_scores')
      .insert(scoresToCreate);

    if (insertError) {
      console.error('Error creating score entries:', insertError);
      return NextResponse.json(
        { error: 'Failed to create score entries' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Successfully initialized ${scoresToCreate.length} score entries`,
      count: scoresToCreate.length,
      round: round
    });

  } catch (error) {
    console.error('Error initializing scores:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
