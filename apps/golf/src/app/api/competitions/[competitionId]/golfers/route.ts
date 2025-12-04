import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamic salary calculator based on field size
// Budget: £60,000 for 6 players = £10,000 average
// Goal: Top 6 players = ~£75k (125% of budget - impossible)
//       Bottom 6 players = ~£48k (80% of budget - need to mix with cheaper)
const TEAM_BUDGET = 60000;
const TEAM_SIZE = 6;
const AVG_SALARY = TEAM_BUDGET / TEAM_SIZE; // £10,000

function calculateDynamicSalaries(fieldSize: number): { min: number; max: number } {
  // For 66 player field:
  // Top player: £15,000 (25% of budget)
  // Bottom player: £6,500 (10.8% of budget)
  // This ensures bottom 6 = ~£48k (need mixing), top 6 = ~£75k (impossible)
  const maxSalary = Math.round(TEAM_BUDGET * 0.25 / 100) * 100; // £15,000
  const minSalary = Math.round(TEAM_BUDGET * 0.108 / 100) * 100; // £6,500
  
  return { min: minSalary, max: maxSalary };
}

function calculateSalaryFromFieldPosition(position: number, totalGolfers: number): number {
  const { min, max } = calculateDynamicSalaries(totalGolfers);
  const range = max - min;
  
  // Linear distribution from max to min
  // Position 0 (best) = max, Position (n-1) (worst) = min
  const ratio = position / Math.max(totalGolfers - 1, 1);
  const salary = max - (range * ratio);
  
  // Round to nearest 100
  const rounded = Math.round(salary / 100) * 100;
  return Math.max(min, Math.min(max, rounded));
}

function getOWGRFactor(ranking: number): number {
  // Not used anymore - keeping for backwards compatibility
  return 0;
}

function roundToClean(value: number): number {
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;

  let cleanRemainder: number;
  if (remainder < 25) cleanRemainder = 0;
  else if (remainder < 55) cleanRemainder = 50;
  else if (remainder < 65) cleanRemainder = 60;
  else if (remainder < 75) cleanRemainder = 70;
  else if (remainder < 85) cleanRemainder = 80;
  else if (remainder < 95) cleanRemainder = 90;
  else cleanRemainder = 100;

  const result = (hundreds * 100) + (cleanRemainder === 100 ? 100 : cleanRemainder);
  return result;
}

function calculateSalary(worldRanking: number, fieldPosition: number, totalGolfers: number): number {
  const salary = calculateSalaryFromFieldPosition(fieldPosition, totalGolfers);
  return roundToClean(salary);
}

// GET - Fetch golfers available in a competition
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the competition to find its tournament_id
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('tournament_id')
      .eq('id', competitionId)
      .single();

    if (compError) {
      console.error('Error fetching competition:', compError);
      throw compError;
    }

    if (!competition?.tournament_id) {
      return NextResponse.json([]);
    }

    // Get golfers directly from tournament_golfers table
    const { data, error } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        golfers (
          id,
          first_name,
          last_name,
          full_name,
          world_rank,
          salary_pennies,
          image_url
        )
      `)
      .eq('tournament_id', competition.tournament_id);

    if (error) {
      console.error('Error fetching tournament golfers:', error);
      throw error;
    }

    // Try to get salaries from tournament_golfer_salaries if they exist
    const golferIds = (data || []).map((m: any) => m.golfer_id).filter(Boolean);
    
    let salariesMap: { [key: string]: number } = {};
    if (golferIds.length > 0 && competition.tournament_id) {
      const { data: salariesData } = await supabase
        .from('tournament_golfer_salaries')
        .select('golfer_id, salary')
        .eq('tournament_id', competition.tournament_id)
        .in('golfer_id', golferIds);
      
      if (salariesData) {
        salariesData.forEach((s: any) => {
          salariesMap[s.golfer_id] = s.salary;
        });
      }
    }

    // Flatten and sort by world ranking first to get proper field positions
    let golfersWithRank = (data || [])
      .filter((member: any) => member.golfers)
      .map((member: any) => ({
        ...member,
        golfer: member.golfers
      }))
      .sort((a, b) => {
        const rankA = a.golfer.world_rank || 999999;
        const rankB = b.golfer.world_rank || 999999;
        return rankA - rankB;
      });

    const totalGolfers = golfersWithRank.length;
    
    // Now calculate salaries based on field position
    const golfers = golfersWithRank.map((member: any, fieldPosition: number) => {
        const golfer = member.golfer;
        const { min } = calculateDynamicSalaries(totalGolfers);
        
        // Priority: 1. tournament_golfer_salaries, 2. field position calculation
        let finalSalary = min;
        
        if (salariesMap[member.golfer_id] && salariesMap[member.golfer_id] > 0) {
          // Use tournament-specific salary from tournament_golfer_salaries table
          finalSalary = salariesMap[member.golfer_id];
        } else {
          // Calculate from field position (0 = best player, n-1 = worst player)
          finalSalary = calculateSalary(golfer.world_rank || 999, fieldPosition, totalGolfers);
        }
        
        return {
          id: golfer.id,
          first_name: golfer.first_name,
          last_name: golfer.last_name,
          full_name: golfer.full_name,
          world_ranking: golfer.world_rank,
          image_url: golfer.image_url,
          salary: finalSalary,
        };
      });

    // Already sorted by world ranking from above
    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET competition golfers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch golfers' },
      { status: 500 }
    );
  }
}
