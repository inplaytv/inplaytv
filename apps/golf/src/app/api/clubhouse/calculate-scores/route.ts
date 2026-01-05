import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { calculateGolferScore } from '@/lib/fantasy-scoring';

export const dynamic = 'force-dynamic';

/**
 * Clubhouse Competition Scoring API
 * Calculates real-time fantasy points for all entries in a clubhouse competition
 * Adapted from InPlay scoring logic for clubhouse tables
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID required' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 1. Fetch competition details
    const { data: competition, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select(`
        id,
        name,
        tournament_id,
        tournaments (
          id,
          name,
          slug,
          status
        )
      `)
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // 2. Fetch all entries with their picks
    const { data: entries, error: entriesError } = await supabase
      .from('clubhouse_entries')
      .select(`
        id,
        user_id,
        profiles (
          display_name
        ),
        clubhouse_entry_picks (
          golfer_id,
          is_captain,
          golfers (
            id,
            first_name,
            last_name,
            country,
            datagolf_id
          )
        )
      `)
      .eq('competition_id', competitionId)
      .order('created_at', { ascending: true });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        competition,
        entries: [],
        lastUpdate: new Date().toISOString()
      });
    }

    // 3. Fetch tournament leaderboard data (from tournament_golfers)
    const { data: tournamentGolfers, error: golfersError } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        current_position,
        total_score,
        round1_score,
        round2_score,
        round3_score,
        round4_score,
        holes_played,
        status
      `)
      .eq('tournament_id', competition.tournament_id);

    if (golfersError) {
      console.error('Error fetching tournament golfers:', golfersError);
      return NextResponse.json(
        { error: 'Failed to fetch tournament data' },
        { status: 500 }
      );
    }

    // Create lookup map for tournament golfer data
    const golferDataMap = new Map();
    if (tournamentGolfers) {
      tournamentGolfers.forEach(tg => {
        golferDataMap.set(tg.golfer_id, tg);
      });
    }

    // 4. Calculate scores for each entry
    const scoredEntries = entries.map(entry => {
      let totalPoints = 0;
      const golferScores: any[] = [];

      entry.clubhouse_entry_picks?.forEach(pick => {
        const golfer = Array.isArray(pick.golfers) ? pick.golfers[0] : pick.golfers;
        const tournamentData = golferDataMap.get(pick.golfer_id);

        if (golfer && tournamentData) {
          // Calculate fantasy points using InPlay scoring logic
          const scoringResult = calculateGolferScore({
            rounds: [],  // TODO: Add actual round data when available
            finalPosition: tournamentData.current_position || undefined,
            madeCut: tournamentData.status !== 'cut',
            isCaptain: pick.is_captain
          });
          
          const points = scoringResult.finalTotal || 0;

          // Apply captain multiplier (already applied in calculateGolferScore)
          const finalPoints = points;
          totalPoints += finalPoints;

          golferScores.push({
            golferId: golfer.id,
            name: `${golfer.first_name} ${golfer.last_name}`,
            country: golfer.country,
            position: tournamentData.current_position,
            totalScore: tournamentData.total_score,
            round1: tournamentData.round1_score,
            round2: tournamentData.round2_score,
            round3: tournamentData.round3_score,
            round4: tournamentData.round4_score,
            holesPlayed: tournamentData.holes_played,
            status: tournamentData.status,
            points: points,
            finalPoints: finalPoints,
            isCaptain: pick.is_captain
          });
        } else {
          // Golfer not found in tournament data (withdrawn/DNS)
          const golferData = Array.isArray(pick.golfers) ? pick.golfers[0] : pick.golfers;
          golferScores.push({
            golferId: golferData?.id,
            name: golferData ? `${golferData.first_name} ${golferData.last_name}` : 'Unknown',
            country: golferData?.country,
            position: null,
            totalScore: null,
            points: 0,
            finalPoints: 0,
            isCaptain: pick.is_captain,
            status: 'withdrawn'
          });
        }
      });

      return {
        entryId: entry.id,
        userId: entry.user_id,
        playerName: ((entry as any).profiles?.display_name) || 'Unknown Player',
        totalPoints,
        golfers: golferScores.sort((a, b) => b.finalPoints - a.finalPoints)
      };
    });

    // Sort entries by total points (descending)
    scoredEntries.sort((a, b) => b.totalPoints - a.totalPoints);

    // Add position numbers
    const rankedEntries = scoredEntries.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    return NextResponse.json({
      competition: {
        id: competition.id,
        name: competition.name,
        tournament: competition.tournaments
      },
      entries: rankedEntries,
      lastUpdate: new Date().toISOString(),
      totalEntries: rankedEntries.length
    });

  } catch (error) {
    console.error('Scoring calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
      );
  }
}
