import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

/**
 * POST /api/admin/competitions/[competitionId]/finalize
 * Calculate final results, determine winners, and store complete competition data
 */
export async function POST(
  request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const supabase = createAdminClient();

    // TODO: Add admin authentication check
    // For now, allowing direct access for testing

    const { competitionId } = params;
    console.log('🏁 Finalizing competition:', competitionId);

    // 1. Get competition details
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        entry_fee_pennies,
        entrants_cap,
        admin_fee_percent,
        status,
        reg_close_at,
        competition_types!tournament_competitions_competition_type_id_fkey (name, slug),
        tournaments!tournament_competitions_tournament_id_fkey (id, name, slug, status, end_date)
      `)
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      console.error('❌ Competition not found:', compError);
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    const competitionType = Array.isArray(competition.competition_types) ? competition.competition_types[0] : competition.competition_types;
    const tournament = Array.isArray(competition.tournaments) ? competition.tournaments[0] : competition.tournaments;

    console.log('✅ Competition:', competitionType?.name);

    // 2. Get all entries with picks
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select(`
        id,
        user_id,
        entry_name,
        total_salary,
        captain_golfer_id,
        created_at,
        status
      `)
      .eq('competition_id', competitionId)
      .in('status', ['submitted', 'pending', 'active', 'completed']);

    if (entriesError) {
      console.error('❌ Failed to fetch entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    console.log(`📊 Processing ${entries.length} entries`);

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries found for this competition' }, { status: 400 });
    }

    // 3. Get picks for all entries
    const entryIds = entries.map(e => e.id);
    const { data: picks, error: picksError } = await supabase
      .from('entry_picks')
      .select('entry_id, golfer_id, slot_position')
      .in('entry_id', entryIds);

    if (picksError) {
      console.error('❌ Failed to fetch picks:', picksError);
      return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
    }

    // 4. Get golfer details
    const golferIds = [...new Set(picks.map(p => p.golfer_id))];
    const { data: golfers, error: golfersError } = await supabase
      .from('golfers')
      .select('id, name, country')
      .in('id', golferIds);

    if (golfersError) {
      console.error('❌ Failed to fetch golfers:', golfersError);
      return NextResponse.json({ error: 'Failed to fetch golfers' }, { status: 500 });
    }

    const golferMap = new Map(golfers.map(g => [g.id, g]));

    // 5. Get tournament leaderboard for fantasy points calculation
    const { data: tournamentLeaderboard, error: leaderboardError } = await supabase
      .from('tournament_golfers')
      .select('golfer_id, r1_score, r2_score, r3_score, r4_score, total_score, position')
      .eq('tournament_id', competition.tournament_id);

    if (leaderboardError) {
      console.error('❌ Failed to fetch tournament leaderboard:', leaderboardError);
    }

    const tournamentScores = new Map(
      tournamentLeaderboard?.map(tg => [tg.golfer_id, tg]) || []
    );

    // 6. Calculate fantasy points for each entry
    const entriesWithScores = entries.map(entry => {
      const entryPicks = picks.filter(p => p.entry_id === entry.id);
      let totalPoints = 0;
      
      const golfersWithPoints = entryPicks.map(pick => {
        const golfer = golferMap.get(pick.golfer_id);
        const tournamentScore = tournamentScores.get(pick.golfer_id);
        const isCaptain = entry.captain_golfer_id === pick.golfer_id;
        
        // Calculate fantasy points (simplified - you can enhance this)
        let points = 0;
        if (tournamentScore && tournamentScore.total_score !== null) {
          // Basic scoring: -1 point per stroke under par
          points = Math.abs(tournamentScore.total_score) * 10;
          
          // Apply captain multiplier
          if (isCaptain) {
            points *= 2;
          }
        }
        
        totalPoints += points;
        
        return {
          golferId: pick.golfer_id,
          name: golfer?.name || 'Unknown',
          country: golfer?.country,
          slotPosition: pick.slot_position,
          isCaptain,
          tournamentScore: tournamentScore?.total_score,
          position: tournamentScore?.position,
          fantasyPoints: points
        };
      });

      return {
        ...entry,
        totalPoints,
        golfers: golfersWithPoints
      };
    });

    // 7. Sort by points (highest first)
    entriesWithScores.sort((a, b) => b.totalPoints - a.totalPoints);

    // 8. Calculate prize distribution
    const totalPrizePool = entries.length * competition.entry_fee_pennies;
    const adminFee = Math.floor(totalPrizePool * (competition.admin_fee_percent / 100));
    const distributedPrize = totalPrizePool - adminFee;

    // Simple prize distribution: 50% / 30% / 20%
    const firstPrizePennies = Math.floor(distributedPrize * 0.50);
    const secondPrizePennies = Math.floor(distributedPrize * 0.30);
    const thirdPrizePennies = Math.floor(distributedPrize * 0.20);

    const prizeDistribution = [
      { position: 1, amount: firstPrizePennies, percentage: 50 },
      { position: 2, amount: secondPrizePennies, percentage: 30 },
      { position: 3, amount: thirdPrizePennies, percentage: 20 }
    ];

    // 9. Create competition result record
    const winner = entriesWithScores[0];
    const top3 = entriesWithScores.slice(0, 3).map((entry, idx) => ({
      userId: entry.user_id,
      entryId: entry.id,
      username: `User ${entry.user_id.substring(0, 8)}`,
      entryName: entry.entry_name,
      points: entry.totalPoints,
      position: idx + 1,
      prize: prizeDistribution[idx]?.amount || 0
    }));

    const { data: result, error: resultError } = await supabase
      .from('competition_results')
      .insert({
        competition_id: competitionId,
        competition_name: competitionType?.name || 'Unknown Competition',
        competition_slug: competitionType?.slug || 'unknown',
        tournament_name: tournament?.name || 'Unknown Tournament',
        tournament_slug: tournament?.slug || 'unknown',
        started_at: competition.reg_close_at,
        completed_at: new Date().toISOString(),
        total_entries: entries.length,
        total_prize_pool_pennies: totalPrizePool,
        admin_fee_pennies: adminFee,
        distributed_prize_pennies: distributedPrize,
        winner_user_id: winner.user_id,
        winner_entry_id: winner.id,
        winner_username: `User ${winner.user_id.substring(0, 8)}`,
        winner_entry_name: winner.entry_name,
        winning_points: winner.totalPoints,
        top_3_entries: top3,
        full_leaderboard: entriesWithScores.map((e, idx) => ({
          position: idx + 1,
          userId: e.user_id,
          entryId: e.id,
          entryName: e.entry_name,
          points: e.totalPoints,
          golfers: e.golfers
        })),
        scoring_method: 'fantasy_points',
        calculation_metadata: {
          calculatedAt: new Date().toISOString(),
          totalEntries: entries.length,
          prizeDistribution
        },
        status: 'pending_payout'
      })
      .select()
      .single();

    if (resultError) {
      console.error('❌ Failed to create result:', resultError);
      console.error('Error details:', JSON.stringify(resultError, null, 2));
      return NextResponse.json({ 
        error: 'Failed to save results', 
        details: resultError.message,
        code: resultError.code 
      }, { status: 500 });
    }

    console.log('✅ Competition result saved:', result.id);

    // 10. Create payout records for winners
    const payouts = [];
    for (let i = 0; i < Math.min(3, entriesWithScores.length); i++) {
      const entry = entriesWithScores[i];
      const prize = prizeDistribution[i];

      const { data: payout, error: payoutError } = await supabase
        .from('competition_payouts')
        .insert({
          competition_result_id: result.id,
          competition_id: competitionId,
          user_id: entry.user_id,
          entry_id: entry.id,
          username: `User ${entry.user_id.substring(0, 8)}`,
          entry_name: entry.entry_name,
          final_position: i + 1,
          total_points: entry.totalPoints,
          prize_amount_pennies: prize.amount,
          prize_percentage: prize.percentage,
          entry_fee_pennies: competition.entry_fee_pennies,
          total_salary_used: entry.total_salary,
          golfers_picked: entry.golfers,
          scorecard_data: {
            picks: entry.golfers,
            totalPoints: entry.totalPoints,
            captainId: entry.captain_golfer_id
          },
          payout_status: 'pending'
        })
        .select()
        .single();

      if (!payoutError && payout) {
        payouts.push(payout);
      }
    }

    console.log(`✅ Created ${payouts.length} payout records`);

    // 11. Calculate analytics
    const scores = entriesWithScores.map(e => e.totalPoints);
    const sortedScores = [...scores].sort((a, b) => a - b);
    
    const { data: analytics, error: analyticsError } = await supabase
      .from('competition_analytics')
      .insert({
        competition_id: competitionId,
        competition_result_id: result.id,
        total_unique_users: new Set(entries.map(e => e.user_id)).size,
        total_entries: entries.length,
        average_entries_per_user: entries.length / new Set(entries.map(e => e.user_id)).size,
        total_revenue_pennies: totalPrizePool,
        total_admin_fees_pennies: adminFee,
        total_prizes_pennies: distributedPrize,
        highest_score: Math.max(...scores),
        lowest_score: Math.min(...scores),
        average_score: scores.reduce((a, b) => a + b, 0) / scores.length,
        median_score: sortedScores[Math.floor(sortedScores.length / 2)],
        calculated_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('✅ Analytics calculated:', analytics?.id);

    // 12. Update competition status
    await supabase
      .from('tournament_competitions')
      .update({ status: 'finalized' })
      .eq('id', competitionId);

    return NextResponse.json({
      success: true,
      result,
      payouts,
      analytics,
      summary: {
        totalEntries: entries.length,
        totalPrizePool: totalPrizePool / 100,
        adminFee: adminFee / 100,
        distributedPrize: distributedPrize / 100,
        winner: {
          username: winner.entry_name,
          points: winner.totalPoints,
          prize: firstPrizePennies / 100
        },
        top3
      }
    });

  } catch (error) {
    console.error('❌ Error finalizing competition:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
