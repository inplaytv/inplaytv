import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';
import { calculateAllSalaries, type GolferSalaryInput } from '@repo/shared/salaryCalculator';

export const dynamic = 'force-dynamic';

/**
 * ENHANCED SALARY CALCULATION SYSTEM
 * 
 * Budget: £60,000 | Team Size: 6 golfers | Salary Range: £5,000 - £12,500
 * 
 * PRIMARY FACTOR - OWGR (Official World Golf Ranking):
 * - Rank #1: 1.0 factor → £12,500
 * - Rank #2: 0.93 factor → £12,000
 * - Rank #5: 0.87 factor → £11,500
 * - Rank #10: 0.75 factor → £10,600
 * - Rank #25: 0.55 factor → £9,100
 * - Rank #50: 0.35 factor → £7,600
 * - Rank #100: 0.22 factor → £6,600
 * - Rank #200: 0.08 factor → £5,600
 * - Rank 300+: 0.0 factor → £5,000
 * 
 * FORM MODIFIER (recent performance):
 * - Excellent/Hot: 1.2× multiplier
 * - Good/Solid: 1.1× multiplier
 * - Average/Steady: 1.0× multiplier
 * - Poor/Struggling: 0.9× multiplier
 * 
 * FIELD SIZE MODIFIER:
 * - ≤30 players: 1.15× multiplier
 * - ≤50 players: 1.10× multiplier
 * - ≤70 players: 1.05× multiplier
 * - ≤100 players: 1.00× multiplier
 * - 100+ players: 0.95× multiplier
 * 
 * PROFESSIONAL ROUNDING:
 * Only allow endings: 000, 500, 600, 700, 800, 900
 * Examples: £11,900, £8,600, £7,500 (NOT £11,847)
 * 
 * VALIDATION:
 * Ensure cheapest 6 golfers cost ≤ 85% of total budget (£51,000)
 * If exceeded, scale all salaries proportionally
 */

// POST - Calculate and optionally apply salaries for a competition
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const { competition_id, budget, apply = false, field_size } = body;

    if (!competition_id) {
      return NextResponse.json({ error: 'competition_id is required' }, { status: 400 });
    }

    const budgetAmount = parseInt(budget) || 60000; // Default £60,000
    const fieldSize = parseInt(field_size) || 100; // Default 100 players

    console.log('💰 Calculating salaries for group:', params.id);
    console.log('💰 Competition:', competition_id);
    console.log('💰 Budget:', budgetAmount);
    console.log('💰 Field Size:', fieldSize);

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

    // Prepare input for salary calculator
    const golferInputs: GolferSalaryInput[] = golfersWithRankings.map((g: any) => ({
      id: g.id,
      full_name: g.full_name,
      world_ranking: g.world_ranking,
      form_modifier: 'average' as const, // Default to average form, can be enhanced later
    }));

    // Calculate salaries using the enhanced system
    const { calculations, stats, needsScaling } = calculateAllSalaries(golferInputs, fieldSize);

    console.log('💰 Salary Range: £', stats.lowest_salary, '-', stats.highest_salary);
    console.log('💰 Average Salary: £', stats.average_salary);
    console.log('💰 Cheapest 6 Total: £', stats.cheapest_six_total, `(${stats.cheapest_six_percentage.toFixed(1)}%)`);
    if (needsScaling) {
      console.log('⚠️  Salaries were scaled to meet 85% validation');
    }

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

    return NextResponse.json({
      success: true,
      applied: apply,
      formula: 'OWGR-based with form & field size modifiers. Professional rounding (000, 500, 600, 700, 800, 900)',
      needsScaling,
      stats,
      calculations: apply ? calculations.slice(0, 20) : calculations, // Return top 20 if applied, all if previewing
    });

  } catch (error: any) {
    console.error('Calculate salaries error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
