/**
 * Fantasy Scoring API Endpoint
 * 
 * Calculate real-time fantasy points for entries based on live tournament data
 * 
 * GET /api/fantasy/calculate-scores?competitionId={id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  calculateGolferScore,
  type GolferPerformance,
  type RoundScore
} from '@/lib/fantasy-scoring';

export const dynamic = 'force-dynamic';

interface EntryWithScoring {
  entryId: string;
  entryName: string;
  userId: string;
  username: string;
  totalPoints: number;
  golfers: {
    id: string;
    name: string;
    points: number;
    isCaptain: boolean;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');
    
    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Get competition details
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('*, tournaments(*)')
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // 2. Get all entries for this competition
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        ),
        entry_golfers (
          golfer_id,
          is_captain,
          golfers (
            id,
            first_name,
            last_name,
            datagolf_id
          )
        )
      `)
      .eq('competition_id', competitionId);

    if (entriesError || !entries) {
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    // 3. Fetch tournament leaderboard data (with hole-by-hole)
    const tournamentId = competition.tournament_id;
    const leaderboardResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tournaments/${tournamentId}/leaderboard`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!leaderboardResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch tournament data' },
        { status: 500 }
      );
    }

    const leaderboardData = await leaderboardResponse.json();
    const tournamentLeaderboard = leaderboardData.leaderboard || [];

    // 4. Calculate fantasy points for each entry
    const entriesWithScores: EntryWithScoring[] = [];

    for (const entry of entries) {
      let totalPoints = 0;
      const golfers: EntryWithScoring['golfers'] = [];

      // Calculate points for each golfer in the entry
      for (const entryGolfer of entry.entry_golfers) {
        const golfer = entryGolfer.golfers;
        const golferFullName = `${golfer.first_name} ${golfer.last_name}`;

        // Find golfer in tournament leaderboard
        const tournamentGolfer = tournamentLeaderboard.find((g: any) => {
          const nameMatch = g.name && g.name.toLowerCase() === golferFullName.toLowerCase();
          const idMatch = g.id === golfer.id || g.id === golfer.datagolf_id;
          return nameMatch || idMatch;
        });

        let golferPoints = 0;

        if (tournamentGolfer) {
          // Build rounds data
          const rounds: RoundScore[] = [];
          const liveScoring = tournamentGolfer.liveScoring;

          if (liveScoring && Array.isArray(liveScoring)) {
            liveScoring.forEach((round: any, roundIndex: number) => {
              if (round.holes && Array.isArray(round.holes)) {
                rounds.push({
                  round: roundIndex + 1,
                  holes: round.holes.map((h: any) => ({
                    hole: h.hole || 0,
                    par: h.par || 4,
                    score: h.score || h.par || 4
                  }))
                });
              }
            });
          }

          // Get final position
          const placement = typeof tournamentGolfer.position === 'string'
            ? parseInt(tournamentGolfer.position.replace(/[^0-9]/g, ''))
            : tournamentGolfer.position;
          const finalPosition = isNaN(placement) ? undefined : placement;

          // Build performance
          const performance: GolferPerformance = {
            rounds,
            finalPosition,
            madeCut: rounds.length >= 2, // Made cut if played 2+ rounds
            isCaptain: entryGolfer.is_captain
          };

          // Calculate score
          const scoring = calculateGolferScore(performance);
          golferPoints = scoring.finalTotal;
        }

        golfers.push({
          id: golfer.id,
          name: golferFullName,
          points: golferPoints,
          isCaptain: entryGolfer.is_captain
        });

        totalPoints += golferPoints;
      }

      entriesWithScores.push({
        entryId: entry.id,
        entryName: entry.entry_name,
        userId: entry.user_id,
        username: entry.users?.username || entry.users?.email || 'Unknown',
        totalPoints,
        golfers
      });
    }

    // 5. Sort by total points (descending)
    entriesWithScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // 6. Add positions
    const leaderboard = entriesWithScores.map((entry, index) => ({
      ...entry,
      position: index + 1
    }));

    return NextResponse.json({
      success: true,
      competition: {
        id: competition.id,
        name: competition.name,
        tournament: competition.tournaments?.name,
        status: competition.status
      },
      leaderboard,
      calculatedAt: new Date().toISOString(),
      totalEntries: leaderboard.length
    });

  } catch (error) {
    console.error('Error calculating fantasy scores:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
