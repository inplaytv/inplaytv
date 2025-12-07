import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {
  try {
    const { entryId } = await params;
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the entry to check ownership and get competition details
    const { data: entry, error: entryError } = await supabase
      .from('competition_entries')
      .select('id, user_id, competition_id, instance_id, captain_golfer_id')
      .eq('id', entryId)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Get start time from competition or instance
    let startDate: string | null = null;
    if (entry.competition_id) {
      const { data: comp } = await supabase
        .from('tournament_competitions')
        .select('start_at')
        .eq('id', entry.competition_id)
        .single();
      startDate = comp?.start_at;
    } else if (entry.instance_id) {
      const { data: inst } = await supabase
        .from('competition_instances')
        .select('start_at')
        .eq('id', entry.instance_id)
        .single();
      startDate = inst?.start_at;
    }

    const isOwner = entry.user_id === user.id;
    const tournamentStarted = startDate ? new Date() >= new Date(startDate) : false;

    // Allow access if user owns the entry OR tournament has started
    if (!isOwner && !tournamentStarted) {
      return NextResponse.json(
        { error: 'You can view other entries once the tournament starts' },
        { status: 403 }
      );
    }

    // Fetch picks with golfer details - includes salary_at_selection (the exact price paid)
    const { data: picks, error: picksError } = await supabase
      .from('entry_picks')
      .select(`
        golfer_id,
        slot_position,
        salary_at_selection,
        golfers (
          first_name,
          last_name,
          world_ranking
        )
      `)
      .eq('entry_id', entryId)
      .order('slot_position', { ascending: true });

    if (picksError) {
      throw picksError;
    }

    // Fetch current salaries from competition_golfers as fallback for entries without salary_at_selection
    const golferIds = (picks || []).map(p => p.golfer_id);
    const compId = entry.competition_id || entry.instance_id;
    const { data: competitionGolfers } = await supabase
      .from('competition_golfers')
      .select('golfer_id, salary')
      .eq('competition_id', compId)
      .in('golfer_id', golferIds);

    const currentSalaryMap = new Map(
      competitionGolfers?.map(cg => [cg.golfer_id, cg.salary]) || []
    );

    // Mark the captain and use salary_at_selection (exact price when picked), fallback to current salary
    const picksWithCaptain = (picks || []).map(pick => {
      const salaryAtSelection = pick.salary_at_selection || 0;
      const currentSalary = currentSalaryMap.get(pick.golfer_id) || 0;
      const finalSalary = salaryAtSelection > 0 ? salaryAtSelection : currentSalary;
      
      return {
        ...pick,
        is_captain: pick.golfer_id === entry.captain_golfer_id,
        salary: finalSalary
      };
    });

    return NextResponse.json({ picks: picksWithCaptain });
  } catch (error: any) {
    console.error('GET entry picks error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch picks' },
      { status: 500 }
    );
  }
}
