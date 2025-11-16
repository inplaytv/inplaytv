import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * SALARY CALCULATION FORMULA
 * 
 * Based on world rankings using an exponential decay curve:
 * - Rank 1 gets the highest salary
 * - Each subsequent rank gets progressively less
 * - The curve ensures top players are significantly more expensive
 * 
 * Formula: salary = (budget / totalWeight) * weight
 * Where weight = 1 / (rank^0.7)
 * 
 * Example for £50,000 budget with 100 golfers:
 * - Rank 1: ~£2,500
 * - Rank 10: ~£800
 * - Rank 50: ~£250
 * - Rank 100: ~£150
 */

interface SalaryCalculation {
  golfer_id: string;
  full_name: string;
  world_ranking: number;
  calculated_salary: number;
  weight: number;
}

// POST - Calculate and optionally apply salaries for a competition
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { competition_id, budget, apply = false } = body;

    if (!competition_id) {
      return NextResponse.json({ error: 'competition_id is required' }, { status: 400 });
    }

    const budgetAmount = parseInt(budget) || 50000; // Default £50,000

    console.log('💰 Calculating salaries for group:', params.id);
    console.log('💰 Competition:', competition_id);
    console.log('💰 Budget:', budgetAmount);

    const adminClient = createAdminClient();

    // Get all golfers in this group with their world rankings
    const { data: members, error: membersError } = await adminClient
      .from('golfer_group_members')
      .select(`
        golfer_id,
        golfers (
          id,
          full_name,
          world_ranking
        )
      `)
      .eq('group_id', params.id);

    if (membersError) throw membersError;

    if (!members || members.length === 0) {
      return NextResponse.json({ error: 'No golfers found in this group' }, { status: 400 });
    }

    // Filter out golfers without rankings and flatten
    const golfersWithRankings = members
      .map((m: any) => m.golfers)
      .filter((g: any) => g && g.world_ranking && g.world_ranking > 0);

    if (golfersWithRankings.length === 0) {
      return NextResponse.json({ error: 'No golfers with world rankings found' }, { status: 400 });
    }

    console.log('📊 Found', golfersWithRankings.length, 'golfers with rankings');

    // Calculate weights using exponential decay curve
    // Lower ranking = higher weight = higher salary
    const calculations: SalaryCalculation[] = golfersWithRankings.map((g: any) => {
      const weight = 1 / Math.pow(g.world_ranking, 0.7);
      return {
        golfer_id: g.id,
        full_name: g.full_name,
        world_ranking: g.world_ranking,
        weight,
        calculated_salary: 0, // Will calculate after we know total weight
      };
    });

    // Calculate total weight
    const totalWeight = calculations.reduce((sum, c) => sum + c.weight, 0);

    // Calculate actual salaries and round to nearest £100
    calculations.forEach(c => {
      const rawSalary = (budgetAmount / totalWeight) * c.weight;
      c.calculated_salary = Math.round(rawSalary / 100) * 100; // Round to nearest £100
    });

    // Sort by world ranking for display
    calculations.sort((a, b) => a.world_ranking - b.world_ranking);

    // If apply=true, update the competition_golfers table
    if (apply) {
      console.log('✍️  Applying salaries to competition_golfers...');

      // Update each golfer's salary in competition_golfers
      const updates = calculations.map(c => 
        adminClient
          .from('competition_golfers')
          .update({ salary: c.calculated_salary })
          .eq('competition_id', competition_id)
          .eq('golfer_id', c.golfer_id)
      );

      await Promise.all(updates);

      console.log('✅ Applied salaries to', calculations.length, 'golfers');
    }

    // Calculate statistics
    const stats = {
      total_golfers: calculations.length,
      total_budget: budgetAmount,
      highest_salary: calculations[0].calculated_salary,
      lowest_salary: calculations[calculations.length - 1].calculated_salary,
      average_salary: Math.round(calculations.reduce((sum, c) => sum + c.calculated_salary, 0) / calculations.length),
      total_allocated: calculations.reduce((sum, c) => sum + c.calculated_salary, 0),
    };

    return NextResponse.json({
      success: true,
      applied: apply,
      formula: 'weight = 1 / (rank^0.7), salary = (budget / totalWeight) * weight, rounded to nearest £100',
      stats,
      calculations: apply ? calculations.slice(0, 10) : calculations, // Return all if previewing, top 10 if applied
    });

  } catch (error: any) {
    console.error('Calculate salaries error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
