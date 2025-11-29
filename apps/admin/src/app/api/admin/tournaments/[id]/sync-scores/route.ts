// ============================================================================
// Tournament Scoring Sync API
// ============================================================================
// POST /api/admin/tournaments/[id]/sync-scores
// Purpose: Fetch latest scores from DataGolf and store in database
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { ScoringService } from '@inplaytv/scoring-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SyncResult {
  success: boolean;
  tournament: {
    id: string;
    name: string;
    currentRound: number;
  };
  stats: {
    playersProcessed: number;
    scoresCreated: number;
    scoresUpdated: number;
    errors: number;
  };
  errors?: string[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;

    // Initialize Supabase with service role for write access
    const supabase = createAdminClient();

    // Verify tournament exists
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, status')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      console.error('Tournament lookup error:', tournamentError);
      return NextResponse.json(
        { error: 'Tournament not found', details: tournamentError?.message },
        { status: 404 }
      );
    }

    // Initialize scoring service
    const scoringService = new ScoringService();
    
    // Fetch latest scores from DataGolf
    console.log(`🔄 Fetching scores for ${tournament.name}...`);
    const tournamentScores = await scoringService.fetchLiveScores(tournamentId, supabase);

    // Prepare sync statistics
    const stats = {
      playersProcessed: 0,
      scoresCreated: 0,
      scoresUpdated: 0,
      errors: 0,
    };
    const errors: string[] = [];

    // Process each player's scores
    for (const playerScore of tournamentScores.scores) {
      stats.playersProcessed++;

      try {
        // Process each round
        for (const [roundKey, roundScore] of Object.entries(playerScore.rounds)) {
          if (!roundScore) continue;

          const roundNumber = parseInt(roundKey.replace('round', ''));

          // Check if score already exists
          const { data: existingScore } = await supabase
            .from('tournament_round_scores')
            .select('id, score, status, is_manual_override')
            .eq('tournament_id', tournamentId)
            .eq('golfer_id', playerScore.golfer.id)
            .eq('round_number', roundNumber)
            .single();

          // Don't overwrite manual overrides
          if (existingScore?.is_manual_override) {
            console.log(
              `⚠️  Skipping ${playerScore.golfer.name} R${roundNumber} - manual override`
            );
            continue;
          }

          const scoreData = {
            tournament_id: tournamentId,
            golfer_id: playerScore.golfer.id,
            round_number: roundNumber,
            score: roundScore.score,
            to_par: roundScore.toPar,
            par_value: 72, // TODO: Get from tournament settings
            status: roundScore.status,
            holes_completed: roundScore.holesCompleted || 0,
            tee_time: roundScore.teeTime?.toISOString(),
            data_source: scoringService.getProviderName(),
            is_manual_override: false,
            raw_api_data: playerScore, // Store complete player data
            fetched_at: new Date().toISOString(),
          };

          if (existingScore) {
            // Update existing score
            const { error: updateError } = await supabase
              .from('tournament_round_scores')
              .update(scoreData)
              .eq('id', existingScore.id);

            if (updateError) {
              console.error(`Error updating score:`, updateError);
              stats.errors++;
              errors.push(
                `${playerScore.golfer.name} R${roundNumber}: ${updateError.message}`
              );
            } else {
              stats.scoresUpdated++;
              console.log(
                `✅ Updated ${playerScore.golfer.name} R${roundNumber}: ${roundScore.score}`
              );
            }
          } else {
            // Create new score
            const { error: insertError } = await supabase
              .from('tournament_round_scores')
              .insert(scoreData);

            if (insertError) {
              console.error(`Error inserting score:`, insertError);
              stats.errors++;
              errors.push(
                `${playerScore.golfer.name} R${roundNumber}: ${insertError.message}`
              );
            } else {
              stats.scoresCreated++;
              console.log(
                `✅ Created ${playerScore.golfer.name} R${roundNumber}: ${roundScore.score}`
              );
            }
          }
        }
      } catch (playerError) {
        console.error(`Error processing ${playerScore.golfer.name}:`, playerError);
        stats.errors++;
        errors.push(
          `${playerScore.golfer.name}: ${
            playerError instanceof Error ? playerError.message : 'Unknown error'
          }`
        );
      }
    }

    // Update tournament last_updated timestamp
    await supabase
      .from('tournaments')
      .update({ 
        updated_at: new Date().toISOString(),
        current_round: tournamentScores.tournament.currentRound,
      })
      .eq('id', tournamentId);

    // Build response
    const result: SyncResult = {
      success: stats.errors === 0,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        currentRound: tournamentScores.tournament.currentRound,
      },
      stats,
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    console.log(`✅ Sync complete for ${tournament.name}:`, stats);

    return NextResponse.json(result, { 
      status: stats.errors > 0 ? 207 : 200 // 207 Multi-Status if partial success
    });

  } catch (error) {
    console.error('Scoring sync error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Retrieve current sync status
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tournamentId = params.id;
    console.log(`🔍 GET sync-scores for tournament: ${tournamentId}`);
    
    const supabase = createAdminClient();

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, status, current_round, updated_at')
      .eq('id', tournamentId)
      .single();

    console.log('Tournament query result:', { tournament, error: tournamentError });

    if (!tournament) {
      console.log(`❌ Tournament not found: ${tournamentId}`);
      return NextResponse.json(
        { error: 'Tournament not found', tournamentId, queryError: tournamentError?.message },
        { status: 404 }
      );
    }

    console.log(`✅ Found tournament: ${tournament.name}`);


    // Get latest scores
    const { data: latestScores, error: scoresError } = await supabase
      .from('tournament_round_scores')
      .select(`
        round_number,
        status,
        data_source,
        is_manual_override,
        updated_at,
        golfer:golfers(full_name)
      `)
      .eq('tournament_id', tournamentId)
      .order('updated_at', { ascending: false })
      .limit(10);

    if (scoresError) {
      console.error('Error fetching scores:', scoresError);
    }

    // Count scores by round
    const { data: scoreCounts } = await supabase
      .from('tournament_round_scores')
      .select('round_number', { count: 'exact', head: false })
      .eq('tournament_id', tournamentId);

    const countsByRound = {
      round1: scoreCounts?.filter((s: any) => s.round_number === 1).length || 0,
      round2: scoreCounts?.filter((s: any) => s.round_number === 2).length || 0,
      round3: scoreCounts?.filter((s: any) => s.round_number === 3).length || 0,
      round4: scoreCounts?.filter((s: any) => s.round_number === 4).length || 0,
    };

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        currentRound: tournament.current_round,
        lastUpdated: tournament.updated_at,
      },
      scoreCounts: countsByRound,
      latestScores: latestScores?.slice(0, 5) || [],
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
