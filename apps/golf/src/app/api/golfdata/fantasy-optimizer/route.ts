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
    const platform = searchParams.get('platform') || 'draftkings'; // draftkings, fanduel, yahoo
    const budget = parseInt(searchParams.get('budget') || '50000'); // DraftKings default
    
    if (!tournamentId) {
      // Return available tournaments
      const { data: tournaments, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'upcoming')
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return NextResponse.json({ tournaments: tournaments || [] });
    }

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    // Get player pricing for this tournament
    const salaryColumn = platform === 'fanduel' 
      ? 'fanduel_salary' 
      : platform === 'yahoo' 
        ? 'yahoo_salary' 
        : 'draftkings_salary';

    const { data: pricing, error: pricingError } = await supabase
      .from('player_dfs_pricing')
      .select(`
        *,
        golfer:golfers(id, name, country, image_url)
      `)
      .eq('tournament_id', tournamentId)
      .not(salaryColumn, 'is', null)
      .order(salaryColumn, { ascending: false });

    if (pricingError) throw pricingError;

    // Get predictions for value calculation
    const { data: predictions, error: predError } = await supabase
      .from('tournament_predictions')
      .select('golfer_id, win_probability, course_fit_score, form_score')
      .eq('tournament_id', tournamentId);

    if (predError) throw predError;

    // Get course fit data
    const { data: courseFit, error: fitError } = await supabase
      .from('player_course_fit_scores')
      .select('golfer_id, fit_score')
      .in('golfer_id', (pricing || []).map(p => p.golfer_id));

    // Merge data and calculate value scores
    const playersWithMetrics = (pricing || []).map(player => {
      const prediction = predictions?.find(p => p.golfer_id === player.golfer_id);
      const fit = courseFit?.find((f: any) => f.golfer_id === player.golfer_id);
      
      const salary = player[salaryColumn] || 0;
      const projectedPoints = calculateProjectedPoints(prediction, fit);
      const pointsPerDollar = salary > 0 ? (projectedPoints / (salary / 1000)) : 0;
      
      return {
        ...player,
        salary,
        projected_points: projectedPoints,
        points_per_dollar: pointsPerDollar,
        value_rating: calculateValueRating(pointsPerDollar, player.projected_ownership || 0),
        win_probability: prediction?.win_probability || 0,
        course_fit_score: prediction?.course_fit_score || fit?.fit_score || 0,
        form_score: prediction?.form_score || 0
      };
    });

    // Generate optimal lineups with different strategies
    const lineups = {
      optimal: generateOptimalLineup(playersWithMetrics, budget, 'balanced'),
      value: generateOptimalLineup(playersWithMetrics, budget, 'value'),
      contrarian: generateOptimalLineup(playersWithMetrics, budget, 'contrarian'),
      safe: generateOptimalLineup(playersWithMetrics, budget, 'safe')
    };

    return NextResponse.json({
      tournament,
      platform,
      budget,
      players: playersWithMetrics.slice(0, 50), // Top 50 for display
      lineups
    });

  } catch (error) {
    console.error('Error generating fantasy lineup:', error);
    return NextResponse.json(
      { error: 'Failed to generate lineup' },
      { status: 500 }
    );
  }
}

// Calculate projected fantasy points based on predictions
function calculateProjectedPoints(prediction: any, fit: any): number {
  if (!prediction) return 50 + (Math.random() * 30); // Base projection
  
  const winProb = prediction.win_probability || 0;
  const courseFit = prediction.course_fit_score || fit?.fit_score || 50;
  const form = prediction.form_score || 50;
  
  // Fantasy points formula (simplified)
  // Higher win probability, course fit, and form = more projected points
  const basePoints = 50;
  const winBonus = winProb * 3; // 3 pts per 1% win prob
  const fitBonus = (courseFit - 50) / 5; // Scaled bonus
  const formBonus = (form - 50) / 5;
  
  return Math.max(30, basePoints + winBonus + fitBonus + formBonus + (Math.random() * 15));
}

// Calculate value rating (1-10)
function calculateValueRating(pointsPerDollar: number, ownership: number): number {
  // High points per dollar + low ownership = high value
  const ppdScore = Math.min(10, pointsPerDollar * 12); // Scale to 10
  const ownershipPenalty = ownership / 10; // Higher ownership = lower value
  
  return Math.max(1, Math.min(10, ppdScore - ownershipPenalty));
}

// Generate optimal lineup based on strategy
function generateOptimalLineup(players: any[], budget: number, strategy: string) {
  const lineupSize = 6; // Standard DFS golf lineup
  let selectedPlayers: any[] = [];
  let remainingBudget = budget;
  
  // Sort players based on strategy
  let sortedPlayers = [...players];
  
  switch (strategy) {
    case 'balanced':
      // Best projected points
      sortedPlayers.sort((a, b) => b.projected_points - a.projected_points);
      break;
    case 'value':
      // Best points per dollar
      sortedPlayers.sort((a, b) => b.points_per_dollar - a.points_per_dollar);
      break;
    case 'contrarian':
      // Low ownership + high upside
      sortedPlayers.sort((a, b) => {
        const aScore = b.projected_points - (a.projected_ownership * 2);
        const bScore = a.projected_points - (b.projected_ownership * 2);
        return bScore - aScore;
      });
      break;
    case 'safe':
      // High floor (course fit + form)
      sortedPlayers.sort((a, b) => {
        const aFloor = (a.course_fit_score + a.form_score) / 2;
        const bFloor = (b.course_fit_score + b.form_score) / 2;
        return bFloor - aFloor;
      });
      break;
  }
  
  // Greedy selection with budget constraint
  for (const player of sortedPlayers) {
    if (selectedPlayers.length >= lineupSize) break;
    if (player.salary <= remainingBudget) {
      selectedPlayers.push(player);
      remainingBudget -= player.salary;
    }
  }
  
  // Fill remaining spots if needed (budget constraints)
  if (selectedPlayers.length < lineupSize) {
    const cheapPlayers = sortedPlayers
      .filter(p => !selectedPlayers.includes(p))
      .sort((a, b) => a.salary - b.salary);
    
    for (const player of cheapPlayers) {
      if (selectedPlayers.length >= lineupSize) break;
      if (player.salary <= remainingBudget) {
        selectedPlayers.push(player);
        remainingBudget -= player.salary;
      }
    }
  }
  
  const totalSalary = selectedPlayers.reduce((sum, p) => sum + p.salary, 0);
  const totalPoints = selectedPlayers.reduce((sum, p) => sum + p.projected_points, 0);
  const avgOwnership = selectedPlayers.reduce((sum, p) => sum + (p.projected_ownership || 0), 0) / selectedPlayers.length;
  
  return {
    players: selectedPlayers.map((p, idx) => ({
      ...p,
      position_in_lineup: idx + 1
    })),
    total_salary: totalSalary,
    remaining_salary: budget - totalSalary,
    projected_points: totalPoints,
    average_ownership: avgOwnership,
    strategy
  };
}
