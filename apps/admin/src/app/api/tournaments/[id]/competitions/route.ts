import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import { assertAdminOrRedirect } from '@/lib/auth';
import { calculateAllSalaries, type GolferSalaryInput } from '@repo/shared/salaryCalculator';

export const dynamic = 'force-dynamic';

// GET - List competition instances for a tournament
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from('tournament_competitions')
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .eq('tournament_id', params.id)
      .eq('competition_format', 'inplay')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || [], {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GET tournament competitions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Add competition instance to tournament
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const body = await request.json();
    const {
      competition_type_id,
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      guaranteed_prize_pool_pennies,
      first_place_prize_pennies,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
      assigned_golfer_group_id,
    } = body;

    if (!competition_type_id) {
      return NextResponse.json(
        { error: 'Competition type ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 🎯 CRITICAL: Auto-calculate from lifecycle manager to prevent wrong dates
    // Get competition type to determine which round tee time to use
    const { data: compType } = await adminClient
      .from('competition_types')
      .select('round_start')
      .eq('id', competition_type_id)
      .single();

    // Fetch tournament with ALL round tee times
    const { data: tournament } = await adminClient
      .from('tournaments')
      .select('registration_opens_at, registration_closes_at, round_1_start, round_2_start, round_3_start, round_4_start, end_date')
      .eq('id', params.id)
      .single();

    // Auto-calculate start_at from lifecycle manager (tournament round tee times)
    let finalStartAt = start_at;
    if (compType?.round_start && tournament) {
      const roundField = `round_${compType.round_start}_start` as keyof typeof tournament;
      const teeTime = tournament[roundField];
      if (teeTime) {
        finalStartAt = teeTime; // ALWAYS use lifecycle manager value
        console.log(`✅ Auto-calculated start_at from lifecycle manager (Round ${compType.round_start}): ${finalStartAt}`);
      }
    }

    // Auto-populate reg_open_at from tournament if not provided
    const finalRegOpenAt = reg_open_at || tournament?.registration_opens_at || null;
    
    // 🎯 FORCE: Always calculate reg_close_at from lifecycle manager (15 mins before start_at)
    // IGNORE whatever the frontend sends - lifecycle manager is source of truth
    let finalRegCloseAt;
    if (finalStartAt) {
      const startTime = new Date(finalStartAt);
      const closeTime = new Date(startTime.getTime() - 15 * 60000); // 15 mins before
      finalRegCloseAt = closeTime.toISOString();
      console.log(`✅ FORCED reg_close_at from lifecycle: ${finalRegCloseAt}`);
    } else if (tournament?.registration_closes_at) {
      finalRegCloseAt = tournament.registration_closes_at;
    } else {
      finalRegCloseAt = null;
    }

    // Auto-calculate end_at from tournament end date
    const finalEndAt = end_at || tournament?.end_date || null;

    const { data, error } = await adminClient
      .from('tournament_competitions')
      .insert({
        tournament_id: params.id,
        competition_type_id,
        competition_format: 'inplay', // CRITICAL: Explicitly set format for InPlay competitions
        entry_fee_pennies: parseInt(entry_fee_pennies) || 0,
        entrants_cap: parseInt(entrants_cap) || 0,
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.00,
        guaranteed_prize_pool_pennies: guaranteed_prize_pool_pennies || null,
        first_place_prize_pennies: first_place_prize_pennies || null,
        reg_open_at: finalRegOpenAt,
        reg_close_at: finalRegCloseAt, // Auto-calculated: 15 mins before start_at
        start_at: finalStartAt || null, // Auto-calculated from lifecycle manager
        end_at: finalEndAt || null,
        status: status || 'draft',
        assigned_golfer_group_id: assigned_golfer_group_id || null,
      })
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This competition type is already added to this tournament' },
          { status: 400 }
        );
      }
      throw error;
    }

    // If a golfer group was assigned, sync the golfers
    if (assigned_golfer_group_id && data) {
      const { data: members } = await adminClient
        .from('golfer_group_members')
        .select('golfer_id')
        .eq('group_id', assigned_golfer_group_id);

      if (members && members.length > 0) {
        const inserts = members.map(m => ({
          competition_id: data.id,
          golfer_id: m.golfer_id,
        }));

        await adminClient
          .from('competition_golfers')
          .insert(inserts);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('POST tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update competition instance
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      entry_fee_pennies,
      entrants_cap,
      admin_fee_percent,
      guaranteed_prize_pool_pennies,
      first_place_prize_pennies,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
      assigned_golfer_group_id,
    } = body;

    console.log('🟢 ADMIN API - PUT Competition Received:', {
      competition_id: competitionId,
      tournament_id: params.id,
      entry_fee_pennies_raw: entry_fee_pennies,
      entry_fee_pennies_parsed: parseInt(entry_fee_pennies) || 0,
      assigned_golfer_group_id,
      body_keys: Object.keys(body),
    });

    const adminClient = createAdminClient();

    // 🎯 CRITICAL: Get competition to find its type (for round_start lookup)
    const { data: existingComp } = await adminClient
      .from('tournament_competitions')
      .select('competition_type_id')
      .eq('id', competitionId)
      .single();

    // Get competition type to determine which round tee time to use
    const { data: compType } = await adminClient
      .from('competition_types')
      .select('round_start')
      .eq('id', existingComp?.competition_type_id)
      .single();

    // Fetch tournament with ALL round tee times
    const { data: tournament } = await adminClient
      .from('tournaments')
      .select('registration_opens_at, registration_closes_at, round_1_start, round_2_start, round_3_start, round_4_start, end_date')
      .eq('id', params.id)
      .single();

    // Auto-calculate start_at from lifecycle manager (tournament round tee times)
    let finalStartAt = start_at;
    if (compType?.round_start && tournament) {
      const roundField = `round_${compType.round_start}_start` as keyof typeof tournament;
      const teeTime = tournament[roundField];
      if (teeTime) {
        finalStartAt = teeTime; // ALWAYS use lifecycle manager value
        console.log(`✅ Auto-recalculated start_at from lifecycle manager (Round ${compType.round_start}): ${finalStartAt}`);
      }
    }

    // Auto-populate reg_open_at from tournament if not provided
    const finalRegOpenAt = reg_open_at || tournament?.registration_opens_at || null;
    
    // 🎯 FORCE: Always calculate reg_close_at from lifecycle manager (15 mins before start_at)
    // IGNORE whatever the frontend sends - lifecycle manager is source of truth
    let finalRegCloseAt;
    if (finalStartAt) {
      const startTime = new Date(finalStartAt);
      const closeTime = new Date(startTime.getTime() - 15 * 60000); // 15 mins before
      finalRegCloseAt = closeTime.toISOString();
      console.log(`✅ FORCED reg_close_at from lifecycle: ${finalRegCloseAt}`);
    } else if (tournament?.registration_closes_at) {
      finalRegCloseAt = tournament.registration_closes_at;
    } else {
      finalRegCloseAt = null;
    }

    // Auto-calculate end_at from tournament end date
    const finalEndAt = end_at || tournament?.end_date || null;

    const { data, error} = await adminClient
      .from('tournament_competitions')
      .update({
        entry_fee_pennies: parseInt(entry_fee_pennies) || 0,
        entrants_cap: parseInt(entrants_cap) || 0,
        admin_fee_percent: parseFloat(admin_fee_percent) || 10.00,
        guaranteed_prize_pool_pennies: guaranteed_prize_pool_pennies || null,
        first_place_prize_pennies: first_place_prize_pennies || null,
        reg_open_at: finalRegOpenAt,
        reg_close_at: finalRegCloseAt, // Auto-calculated: 15 mins before start_at
        start_at: finalStartAt || null, // Auto-recalculated from lifecycle manager
        end_at: finalEndAt || null,
        status: status || 'draft',
        assigned_golfer_group_id: assigned_golfer_group_id || null,
      })
      .eq('id', competitionId)
      .eq('tournament_id', params.id)
      .select(`
        *,
        competition_types (
          id,
          name,
          slug
        )
      `)
      .single();

    console.log('🟢 ADMIN API - PUT Competition Result:', {
      success: !error,
      updated_entry_fee: data?.entry_fee_pennies,
      updated_golfer_group: data?.assigned_golfer_group_id,
      error: error?.message,
    });

    if (error) throw error;

    // Handle golfer group changes - ALWAYS process this, whether adding, changing, or removing
    console.log('🔵 Processing golfer group change...');
    console.log('🔵 Competition ID:', competitionId);
    console.log('🔵 New golfer group ID:', assigned_golfer_group_id);

    // First, ALWAYS clear existing golfers
    const { error: deleteError } = await adminClient
      .from('competition_golfers')
      .delete()
      .eq('competition_id', competitionId);

    if (deleteError) {
      console.error('❌ Error clearing existing golfers:', deleteError);
    } else {
      console.log('🗑️  Cleared existing golfers from competition');
    }

    // Then, if a group is assigned, add the new golfers
    if (assigned_golfer_group_id && assigned_golfer_group_id !== '' && assigned_golfer_group_id !== null) {
      console.log('🔵 Syncing golfers from group:', assigned_golfer_group_id);
      
      // Get golfers from the group WITH their world rankings
      const { data: members, error: membersError } = await adminClient
        .from('golfer_group_members')
        .select(`
          golfer_id,
          golfers (
            id,
            world_ranking
          )
        `)
        .eq('group_id', assigned_golfer_group_id);

      console.log('🔵 Found', members?.length || 0, 'members in group');

      if (!membersError && members && members.length > 0) {
        // First, remove existing golfers
        const { error: deleteError } = await adminClient
          .from('competition_golfers')
          .delete()
          .eq('competition_id', competitionId);

        if (deleteError) {
          console.error('❌ Error deleting old golfers:', deleteError);
        } else {
          console.log('🗑️  Deleted existing golfers from competition');
        }

        // Calculate salaries using enhanced OWGR-based system
        const golfersWithRankings = members
          .map((m: any) => m.golfers)
          .filter((g: any) => g && g.world_ranking && g.world_ranking > 0);

        console.log('💰 Calculating salaries for', golfersWithRankings.length, 'golfers with rankings');

        // Prepare golfer inputs for new salary calculator
        const golferInputs: GolferSalaryInput[] = golfersWithRankings.map((g: any) => ({
          id: g.id,
          full_name: g.full_name,
          world_ranking: g.world_ranking,
          form_modifier: 'average' as const,
        }));

        // Calculate salaries using enhanced system (£60,000 budget)
        const { calculations } = calculateAllSalaries(golferInputs, golfersWithRankings.length);

        // Create inserts for competition_golfers
        const inserts = calculations.map(c => ({
          competition_id: competitionId,
          golfer_id: c.golfer_id,
          salary: c.calculated_salary,
        }));

        // Add golfers without rankings with default salary
        const golfersWithoutRankings = members
          .map((m: any) => m.golfers)
          .filter((g: any) => g && (!g.world_ranking || g.world_ranking <= 0));

        golfersWithoutRankings.forEach((g: any) => {
          inserts.push({
            competition_id: competitionId,
            golfer_id: g.id,
            salary: 5000, // Default £5,000 for golfers without ranking
          });
        });

        console.log('📝 Inserting', inserts.length, 'golfers with calculated salaries');
        if (inserts.length > 0) {
          console.log('📝 Sample salaries:', inserts.slice(0, 3).map(i => `£${i.salary}`).join(', '));
        }

        const { data: insertedData, error: insertError } = await adminClient
          .from('competition_golfers')
          .insert(inserts)
          .select();

        if (insertError) {
          console.error('❌ Error syncing golfers:', insertError);
          console.error('❌ Insert error details:', JSON.stringify(insertError, null, 2));
        } else if (!insertedData || insertedData.length === 0) {
          console.error('❌ WARNING: Insert succeeded but returned 0 rows!');
          console.error('❌ Tried to insert:', inserts.length, 'golfers');
          console.error('❌ Sample insert data:', inserts.slice(0, 2));
        } else {
          console.log(`✅ Synced ${insertedData.length} golfers with auto-calculated salaries`);
          const salaries = inserts.map(i => i.salary);
          console.log(`💰 Salary range: £${Math.min(...salaries)} - £${Math.max(...salaries)}`);
          console.log(`💰 Actual inserted count from DB: ${insertedData.length}`);
        }
      } else {
        console.log('⚠️  No members found or error:', membersError);
      }
    } else {
      console.log('✅ No golfer group assigned - competition golfers cleared');
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove competition instance from tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await assertAdminOrRedirect();
    
    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    if (!competitionId) {
      return NextResponse.json(
        { error: 'Competition ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    
    // SAFETY CHECK: Only allow deletion of InPlay competitions, not ONE 2 ONE challenges
    const { data: comp } = await adminClient
      .from('tournament_competitions')
      .select('competition_format')
      .eq('id', competitionId)
      .single();
    
    if (comp?.competition_format === 'one2one') {
      return NextResponse.json(
        { error: 'Cannot delete ONE 2 ONE challenges from this endpoint. Use ONE 2 ONE Templates page.' },
        { status: 403 }
      );
    }
    
    const { error } = await adminClient
      .from('tournament_competitions')
      .delete()
      .eq('id', competitionId)
      .eq('tournament_id', params.id)
      .eq('competition_format', 'inplay');

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE tournament competition error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
