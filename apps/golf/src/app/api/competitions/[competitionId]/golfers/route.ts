import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Inline salary calculator (to avoid workspace dependency issues)
const MIN_SALARY = 5000;
const MAX_SALARY = 12500;
const BASE_RANGE = MAX_SALARY - MIN_SALARY;

const OWGR_FACTORS: { [key: number]: number } = {
  1: 1.0,    // £12,500
  2: 0.93,   // £12,000
  5: 0.87,   // £11,500
  10: 0.75,  // £10,600
  25: 0.55,  // £9,100
  50: 0.35,  // £7,600
  100: 0.22, // £6,600
  200: 0.08, // £5,600
  300: 0.0,  // £5,000
};

function getOWGRFactor(ranking: number): number {
  if (ranking < 1) ranking = 1;
  if (ranking >= 300) return 0.0;
  if (OWGR_FACTORS[ranking] !== undefined) return OWGR_FACTORS[ranking];

  const sortedRanks = Object.keys(OWGR_FACTORS).map(Number).sort((a, b) => a - b);
  let lowerRank = sortedRanks[0];
  let upperRank = sortedRanks[sortedRanks.length - 1];

  for (let i = 0; i < sortedRanks.length - 1; i++) {
    if (ranking >= sortedRanks[i] && ranking <= sortedRanks[i + 1]) {
      lowerRank = sortedRanks[i];
      upperRank = sortedRanks[i + 1];
      break;
    }
  }

  const lowerFactor = OWGR_FACTORS[lowerRank];
  const upperFactor = OWGR_FACTORS[upperRank];
  const ratio = (ranking - lowerRank) / (upperRank - lowerRank);
  return lowerFactor + (upperFactor - lowerFactor) * ratio;
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
  return Math.max(MIN_SALARY, Math.min(MAX_SALARY, result));
}

function calculateSalary(worldRanking: number): number {
  const owgrFactor = getOWGRFactor(worldRanking);
  const baseSalary = MIN_SALARY + (BASE_RANGE * owgrFactor);
  return roundToClean(baseSalary);
}

// GET - Fetch golfers available in a competition
export async function GET(
  request: NextRequest,
  { params }: { params: { competitionId: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, get the competition to find its assigned_golfer_group_id
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('assigned_golfer_group_id, tournament_id')
      .eq('id', params.competitionId)
      .single();

    if (compError) {
      console.error('Error fetching competition:', compError);
      throw compError;
    }

    if (!competition?.assigned_golfer_group_id) {
      return NextResponse.json([]);
    }

    // Get golfers from the assigned golfer group
    const { data, error } = await supabase
      .from('golfer_group_members')
      .select(`
        golfer_id,
        golfers (
          id,
          first_name,
          last_name,
          full_name,
          world_rank,
          image_url
        )
      `)
      .eq('group_id', competition.assigned_golfer_group_id);

    if (error) {
      console.error('Error fetching group golfers:', error);
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

    // Flatten the data structure and calculate salaries
    const golfers = (data || [])
      .filter((member: any) => member.golfers)
      .map((member: any) => {
        const golfer = member.golfers;
        
        // Priority: 1. DB salary, 2. Calculate from world rank, 3. Default
        let finalSalary = MIN_SALARY;
        
        if (salariesMap[member.golfer_id] && salariesMap[member.golfer_id] > 0) {
          finalSalary = salariesMap[member.golfer_id];
        } else if (golfer.world_rank && golfer.world_rank > 0) {
          finalSalary = calculateSalary(golfer.world_rank);
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

    return NextResponse.json(golfers);
  } catch (error: any) {
    console.error('GET competition golfers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch golfers' },
      { status: 500 }
    );
  }
}
