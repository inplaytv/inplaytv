import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createServerClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch basic entries first
    let { data: entries, error } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    // Fetch all related data separately
    if (entries && entries.length > 0) {
      const entryIds = entries.map(e => e.id);
      const competitionIds = Array.from(new Set(entries.map(e => e.competition_id).filter(Boolean)));
      const instanceIds = Array.from(new Set(entries.map(e => e.instance_id).filter(Boolean)));
      
      console.log('🔍 Fetching data for:', { 
        totalEntries: entries.length, 
        competitionIds: competitionIds.length, 
        instanceIds: instanceIds.length 
      });
      
      // Fetch entry picks
      const { data: allPicks } = await supabase
        .from('entry_picks')
        .select('*')
        .in('entry_id', entryIds);

      // Get golfer IDs from picks
      const golferIds = Array.from(new Set(allPicks?.map(p => p.golfer_id) || []));
      
      // Fetch golfers (removed country column as it doesn't exist)
      const { data: golfers, error: golfersError } = await supabase
        .from('golfers')
        .select('id, first_name, last_name, world_ranking')
        .in('id', golferIds);

      if (golfersError) {
        throw golfersError;
      }

      // Fetch tournament_competitions (regular competitions)
      let competitions = null;
      if (competitionIds.length > 0) {
        const { data, error: competitionsError } = await supabase
          .from('tournament_competitions')
          .select('id, tournament_id, competition_type_id, entry_fee_pennies, start_at, end_at')
          .in('id', competitionIds);

        if (competitionsError) {
          throw competitionsError;
        }
        competitions = data;
      }

      // Fetch competition_instances (ONE 2 ONE)
      let instances = null;
      if (instanceIds.length > 0) {
        const { data, error: instancesError } = await supabase
          .from('competition_instances')
          .select(`
            id,
            tournament_id,
            template_id,
            current_players,
            max_players,
            status,
            start_at,
            end_at,
            entry_fee_pennies,
            competition_templates!competition_instances_template_id_fkey (
              name,
              admin_fee_percent
            )
          `)
          .in('id', instanceIds)
          .in('status', ['open', 'active']);  // Only show open or active matches, not 'full' or 'completed'

        if (instancesError) {
          throw instancesError;
        }
        instances = data;
      }

      // Filter out entries with deleted instances or competitions FIRST
      const validCompetitionIds = new Set(competitions?.map(c => c.id) || []);
      const validInstanceIds = new Set(instances?.map(i => i.id) || []);
      
      console.log('📝 Filtering entries:', {
        totalEntries: entries.length,
        validCompetitions: validCompetitionIds.size,
        validInstances: validInstanceIds.size
      });
      
      const beforeFilter = entries.length;
      entries = entries.filter(entry => {
        // If it has a competition_id, check if competition exists
        if (entry.competition_id) {
          return validCompetitionIds.has(entry.competition_id);
        }
        // If it has an instance_id, check if instance exists
        if (entry.instance_id) {
          return validInstanceIds.has(entry.instance_id);
        }
        // If neither, filter it out (orphaned entry)
        return false;
      });
      
      console.log('✅ Filtered:', {
        before: beforeFilter,
        after: entries.length,
        removed: beforeFilter - entries.length
      });

      // If no valid entries left, return empty array
      if (entries.length === 0) {
        return NextResponse.json({ entries: [] });
      }

      // Combine regular competitions and instances
      const allCompetitions = [
        ...(competitions || []),
        ...(instances || []).map((inst: any) => ({
          id: inst.id,
          tournament_id: inst.tournament_id,
          competition_type_id: null, // ONE 2 ONE doesn't have type_id
          entry_fee_pennies: inst.entry_fee_pennies || 0,
          admin_fee_percent: inst.competition_templates?.admin_fee_percent || 10,
          start_at: inst.start_at,
          end_at: inst.end_at,
          is_one_2_one: true,
          match_status: inst.status,
          current_players: inst.current_players,
          max_players: inst.max_players,
          competition_type_name: inst.competition_templates?.name || 'ONE 2 ONE'
        }))
      ];

      if (allCompetitions && allCompetitions.length > 0) {
        const tournamentIds = Array.from(new Set(allCompetitions.map(c => c.tournament_id)));
        const typeIds = Array.from(new Set(allCompetitions.map(c => c.competition_type_id).filter(Boolean)));

        // Fetch tournaments and competition types
        const { data: tournaments, error: tournamentsError } = await supabase
          .from('tournaments')
          .select('id, name, start_date, end_date, status')
          .in('id', tournamentIds);

        const { data: types } = await supabase
          .from('competition_types')
          .select('id, name')
          .in('id', typeIds);

        // Build lookup maps and transform data to match frontend expectations
        const golferMap = new Map(golfers?.map(g => [g.id, {
          id: g.id,
          name: `${g.first_name} ${g.last_name}`,
          salary: 0, // Will need to get from tournament_golfers
          owgr_rank: g.world_ranking
        }]));
        const tournamentMap = new Map(tournaments?.map(t => [t.id, {
          id: t.id,
          name: t.name,
          start_date: t.start_date,
          end_date: t.end_date,
          status: t.status
        }]));
        const typeMap = new Map(types?.map(t => [t.id, t]));

        // Group picks by entry_id
        const picksByEntry = new Map<string, any[]>();
        allPicks?.forEach(pick => {
          if (!picksByEntry.has(pick.entry_id)) {
            picksByEntry.set(pick.entry_id, []);
          }
          picksByEntry.get(pick.entry_id)!.push({
            ...pick,
            golfers: golferMap.get(pick.golfer_id)
          });
        });

        // Merge competition data with tournaments and types
        const competitionMap = new Map();
        allCompetitions.forEach(comp => {
          const tournament = tournamentMap.get(comp.tournament_id);
          const compType = comp.is_one_2_one ? { name: comp.competition_type_name } : typeMap.get(comp.competition_type_id);
          competitionMap.set(comp.id, {
            ...comp,
            // Use tournament dates, not competition dates
            start_date: tournament?.start_date || comp.start_at,
            end_date: tournament?.end_date || comp.end_at,
            tournaments: tournament,
            competition_types: compType
          });
        });

        // Attach all data to entries
        entries.forEach(entry => {
          const compId = entry.competition_id || entry.instance_id;
          entry.tournament_competitions = competitionMap.get(compId);
          entry.entry_picks = picksByEntry.get(entry.id) || [];
        });
      }
    }

    return NextResponse.json({ entries: entries || [] });
  } catch (error: any) {
    console.error('❌ GET my-entries error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}
