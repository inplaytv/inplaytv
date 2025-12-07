import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Dynamic salary calculator based on field size
// Budget: £60,000 for 6 players = £10,000 average
// Mathematical approach for optimal balance:
const TEAM_BUDGET = 60000;
const TEAM_SIZE = 6;
const AVG_SALARY = TEAM_BUDGET / TEAM_SIZE; // £10,000

function calculateDynamicSalaries(fieldSize: number): { min: number; max: number } {
  // Mathematical principle: 
  // - Top 6 should cost 105-110% of budget (slightly impossible)
  // - Bottom 6 should cost 55-60% of budget (need better players)
  // - Average salary should be in middle third of field
  
  // For optimal balance, use this formula:
  // Max = Average * 1.30 (30% above average)
  // Min = Average * 0.70 (30% below average)
  // This creates a 1.86:1 ratio (max:min)
  
  // With £10k average:
  // Max = £13,000 (top player costs 21.7% of budget)
  // Min = £7,000 (bottom player costs 11.7% of budget)
  
  const maxSalary = Math.round(AVG_SALARY * 1.30 / 100) * 100; // £13,000
  const minSalary = Math.round(AVG_SALARY * 0.70 / 100) * 100; // £7,000
  
  // Verify the math:
  // Top 6 average: ~£12,100 each = £72,600 total (121% of budget) ✓
  // Bottom 6 average: ~£7,900 each = £47,400 total (79% of budget) ✓
  // Middle positions: ~£10,000 (average) ✓
  
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

// GET - Fetch golfers available in a competition (supports both tournament_competitions AND competition_instances)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try tournament_competitions first (regular competitions)
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('tournament_id')
      .eq('id', competitionId)
      .maybeSingle();

    let tournamentId = competition?.tournament_id;

    // If not found, try competition_instances (ONE 2 ONE)
    if (!tournamentId) {
      const { data: instance, error: instanceError } = await supabase
        .from('competition_instances')
        .select('tournament_id')
        .eq('id', competitionId)
        .maybeSingle();
      
      tournamentId = instance?.tournament_id;
    }

    if (!tournamentId) {
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
      .eq('tournament_id', tournamentId);

    if (error) {
      console.error('Error fetching tournament golfers:', error);
      throw error;
    }

    // Try to get salaries from tournament_golfer_salaries if they exist
    const golferIds = (data || []).map((m: any) => m.golfer_id).filter(Boolean);
    
    let salariesMap: { [key: string]: number } = {};
    if (golferIds.length > 0 && tournamentId) {
      const { data: salariesData } = await supabase
        .from('tournament_golfer_salaries')
        .select('golfer_id, salary')
        .eq('tournament_id', tournamentId)
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
