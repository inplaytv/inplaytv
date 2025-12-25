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
  // - Top 6 should cost ~100-105% of budget (just at the limit)
  // - Bottom 6 should cost 60-65% of budget (need better players)
  // - Average salary should be in middle third of field
  
  // For optimal balance, use this formula:
  // Max = £11,000 (top player costs 18.3% of budget)
  // Min = £7,000 (bottom player costs 11.7% of budget)
  // This creates a 1.57:1 ratio (max:min)
  
  // With £10k average:
  // Max = £11,000 
  // Min = £7,000
  
  const maxSalary = 11000; // £11,000
  const minSalary = 7000;  // £7,000
  
  // Verify the math:
  // Top 6 average: ~£10,300 each = £61,800 total (103% of budget) ✓
  // Bottom 6 average: ~£7,700 each = £46,200 total (77% of budget) ✓
  // Middle positions: ~£9,000 (slightly below average) ✓
  
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
      .select('tournament_id, assigned_golfer_group_id')
      .eq('id', competitionId)
      .maybeSingle();

    console.log('🔵 GOLFERS API - Competition data:', { competitionId, competition, compError });

    let tournamentId = competition?.tournament_id;
    let golferGroupId = competition?.assigned_golfer_group_id;

    // If not found, try competition_instances (ONE 2 ONE)
    if (!tournamentId) {
      const { data: instance, error: instanceError } = await supabase
        .from('competition_instances')
        .select('tournament_id, template_id')
        .eq('id', competitionId)
        .maybeSingle();
      
      console.log('🔵 GOLFERS API - Instance data:', { instance, instanceError });
      
      tournamentId = instance?.tournament_id;
      
      // ONE 2 ONE instances inherit golfer group from their template competition
      if (instance?.template_id) {
        const { data: templateComp } = await supabase
          .from('tournament_competitions')
          .select('assigned_golfer_group_id')
          .eq('id', instance.template_id)
          .maybeSingle();
        
        golferGroupId = templateComp?.assigned_golfer_group_id;
        console.log('🔵 GOLFERS API - Inherited golfer group from template:', golferGroupId);
      }
    }

    if (!tournamentId) {
      return NextResponse.json([]);
    }

    // Get golfers for tournament
    let golfersQuery = supabase
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
    
    const { data, error } = await golfersQuery;

    if (error) {
      console.error('Error fetching tournament golfers:', error);
      throw error;
    }

    // CRITICAL FIX: Filter by golfer group if competition has one assigned
    let filteredData = data || [];
    if (golferGroupId) {
      console.log(`🎯 Filtering ${filteredData.length} golfers by group: ${golferGroupId}`);
      
      // Get golfers in this group
      const { data: groupMembers, error: gmError } = await supabase
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', golferGroupId);
      
      if (gmError) {
        console.error('Error fetching group members:', gmError);
      } else if (groupMembers) {
        const groupGolferIds = new Set(groupMembers.map(m => m.golfer_id));
        filteredData = filteredData.filter(g => groupGolferIds.has(g.golfer_id));
        console.log(`✅ Filtered to ${filteredData.length} golfers in group`);
      }
    } else {
      console.warn(`⚠️ No golfer group assigned to competition ${competitionId}, showing all ${filteredData.length} tournament golfers`);
    }

    // Deduplicate golfers (safety check in case duplicates exist in database)
    const seenGolferIds = new Set<string>();
    const deduplicatedData = filteredData.filter((item: any) => {
      if (seenGolferIds.has(item.golfer_id)) {
        console.warn(`⚠️ Duplicate golfer detected for tournament ${tournamentId}: ${item.golfer_id}`);
        return false;
      }
      seenGolferIds.add(item.golfer_id);
      return true;
    });

    console.log(`📊 Golfers: ${data?.length || 0} total, ${filteredData.length} in group, ${deduplicatedData.length} unique`);

    // Try to get salaries from tournament_golfer_salaries if they exist
    const golferIds = deduplicatedData.map((m: any) => m.golfer_id).filter(Boolean);
    
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
    let golfersWithRank = deduplicatedData
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
