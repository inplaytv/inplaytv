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

    console.log('🔍 Fetching entries for user:', user.id);

    // Fetch basic entries first
    const { data: entries, error } = await supabase
      .from('competition_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      throw error;
    }

    console.log('✅ Found entries:', entries?.length || 0);

    // Fetch all related data separately
    if (entries && entries.length > 0) {
      const entryIds = entries.map(e => e.id);
      const competitionIds = [...new Set(entries.map(e => e.competition_id))];
      
      console.log('📋 Fetching picks for', entryIds.length, 'entries');
      
      // Fetch entry picks
      const { data: allPicks } = await supabase
        .from('entry_picks')
        .select('*')
        .in('entry_id', entryIds);

      console.log('⛳ Found', allPicks?.length || 0, 'picks');

      // Get golfer IDs from picks
      const golferIds = [...new Set(allPicks?.map(p => p.golfer_id) || [])];
      
      console.log('👥 Fetching', golferIds.length, 'golfers');
      console.log('🔍 Golfer IDs:', golferIds);
      
      // Fetch golfers
      const { data: golfers, error: golfersError } = await supabase
        .from('golfers')
        .select('id, first_name, last_name, country, world_ranking')
        .in('id', golferIds);

      if (golfersError) {
        console.error('❌ Error fetching golfers:', golfersError);
      }

      console.log('🏌️ Found', golfers?.length || 0, 'golfers');
      console.log('🏆 Fetching', competitionIds.length, 'competitions');
      console.log('🔍 Competition IDs:', competitionIds);

      // Fetch tournament_competitions
      const { data: competitions, error: competitionsError } = await supabase
        .from('tournament_competitions')
        .select('id, tournament_id, competition_type_id, entry_fee_pennies, start_at, end_at')
        .in('id', competitionIds);

      if (competitionsError) {
        console.error('❌ Error fetching competitions:', competitionsError);
      }

      console.log('🎯 Found', competitions?.length || 0, 'competitions');

      if (competitions && competitions.length > 0) {
        const tournamentIds = [...new Set(competitions.map(c => c.tournament_id))];
        const typeIds = [...new Set(competitions.map(c => c.competition_type_id))];

        // Fetch tournaments and competition types
        const { data: tournaments } = await supabase
          .from('tournaments')
          .select('id, name, start_at, end_at, status')
          .in('id', tournamentIds);

        const { data: types } = await supabase
          .from('competition_types')
          .select('id, name')
          .in('id', typeIds);

        // Build lookup maps and transform data to match frontend expectations
        const golferMap = new Map(golfers?.map(g => [g.id, {
          id: g.id,
          name: `${g.first_name} ${g.last_name}`,
          country: g.country,
          salary: 0, // Will need to get from tournament_golfers
          owgr_rank: g.world_ranking
        }]));
        const tournamentMap = new Map(tournaments?.map(t => [t.id, {
          id: t.id,
          name: t.name,
          start_date: t.start_at,
          end_date: t.end_at,
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
        competitions.forEach(comp => {
          competitionMap.set(comp.id, {
            ...comp,
            start_date: comp.start_at,
            end_date: comp.end_at,
            tournaments: tournamentMap.get(comp.tournament_id),
            competition_types: typeMap.get(comp.competition_type_id)
          });
        });

        // Attach all data to entries
        entries.forEach(entry => {
          entry.tournament_competitions = competitionMap.get(entry.competition_id);
          entry.entry_picks = picksByEntry.get(entry.id) || [];
        });

        console.log('✅ Merged all data successfully');
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
