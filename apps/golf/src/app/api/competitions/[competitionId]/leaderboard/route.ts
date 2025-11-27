import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: { competitionId: string } }
) {
  try {
    const supabase = await createServerClient();

    // Get current user (optional - leaderboard can be public)
    const { data: { user } } = await supabase.auth.getUser();
    console.log('🔐 User requesting leaderboard:', user?.email || 'Anonymous');

    const { competitionId } = params;
    console.log('🎯 Fetching leaderboard for competition:', competitionId);

    // Fetch competition details with tournament info
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        entry_fee_pennies,
        entrants_cap,
        admin_fee_percent,
        status,
        competition_types (
          name,
          slug
        ),
        tournaments!tournament_competitions_tournament_id_fkey (
          id,
          name,
          slug,
          location,
          start_date,
          end_date,
          status
        )
      `)
      .eq('id', competitionId)
      .single();

    if (compError || !competition) {
      console.error('❌ Competition not found:', compError);
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    console.log('✅ Competition found:', competition.competition_types);

    // Fetch all entries for this competition with user details
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select(`
        id,
        user_id,
        entry_name,
        total_salary,
        captain_golfer_id,
        created_at,
        status
      `)
      .eq('competition_id', competitionId)
      .in('status', ['submitted', 'pending', 'active', 'completed'])
      .order('created_at', { ascending: true});

    if (entriesError) {
      console.error('❌ Failed to fetch entries:', entriesError);
      return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }

    console.log(`📊 Found ${entries?.length || 0} entries for this competition`);
    if (entries && entries.length > 0) {
      console.log('Sample entry:', entries[0]);
    }

    // Fetch all picks for these entries
    const entryIds = entries?.map(e => e.id) || [];
    console.log('🔍 Fetching picks for entry IDs:', entryIds);
    
    // First get all picks
    const { data: allPicks, error: picksError } = await supabase
      .from('entry_picks')
      .select('entry_id, golfer_id, slot_position')
      .in('entry_id', entryIds);

    console.log('📊 Picks query result:', { 
      picksCount: allPicks?.length || 0, 
      error: picksError,
      samplePick: allPicks?.[0]
    });

    if (picksError) {
      console.error('❌ Error fetching picks:', picksError);
      return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
    }

    // Get unique golfer IDs
    const golferIdsSet = new Set(allPicks?.map(p => p.golfer_id) || []);
    const golferIds = Array.from(golferIdsSet);
    console.log('🎯 Fetching golfer details for IDs:', golferIds);

    // Get golfer details separately
    const { data: golfers, error: golfersError } = await supabase
      .from('golfers')
      .select('id, name, country')
      .in('id', golferIds);

    console.log('👥 Golfers fetched:', golfers?.length || 0);

    if (golfersError) {
      console.error('❌ Error fetching golfers:', golfersError);
    }

    // Create a map of golfer details
    const golferMap = new Map(golfers?.map(g => [g.id, g]) || []);

    // Group picks by entry_id and enrich with golfer data
    const picksByEntry: Record<string, any[]> = {};
    allPicks?.forEach(pick => {
      if (!picksByEntry[pick.entry_id]) {
        picksByEntry[pick.entry_id] = [];
      }
      const golferData = golferMap.get(pick.golfer_id);
      picksByEntry[pick.entry_id].push({
        ...pick,
        golfer: golferData
      });
    });
    
    console.log('📦 Picks grouped by entry:', Object.keys(picksByEntry).map(entryId => ({
      entryId,
      pickCount: picksByEntry[entryId].length
    })));

    // Format entries for leaderboard
    const leaderboardEntries = entries?.map((entry, index) => {
      const picks = picksByEntry[entry.id] || [];
      const username = `User ${entry.user_id.substring(0, 8)}`; // Temporary - show first 8 chars of user ID
      
      // TODO: Calculate actual fantasy points from golfer scores
      // For now, return mock data structure
      return {
        userId: entry.user_id,
        entryId: entry.id,
        username: username,
        entryName: entry.entry_name,
        totalPoints: 0, // TODO: Calculate from actual scores
        position: index + 1,
        round: 1, // TODO: Get current round from tournament
        score: 0, // TODO: Calculate from golfer scores
        birdies: 0, // TODO: Calculate from golfer scores
        totalSalary: entry.total_salary,
        captainGolferId: entry.captain_golfer_id,
        picks: picks.map(p => ({
          golferId: p.golfer_id,
          name: p.golfer?.name || 'Unknown',
          country: p.golfer?.country || 'Unknown',
          slotPosition: p.slot_position
        })),
        createdAt: entry.created_at
      };
    }) || [];

    const compType = Array.isArray(competition.competition_types) 
      ? competition.competition_types[0] 
      : competition.competition_types;

    return NextResponse.json({
      competition: {
        id: competition.id,
        name: compType?.name || 'Competition',
        slug: compType?.slug || '',
        status: competition.status,
        entrantsCap: competition.entrants_cap,
        entryFeePennies: competition.entry_fee_pennies,
        tournament: competition.tournaments
      },
      entries: leaderboardEntries,
      totalEntries: leaderboardEntries.length
    });
  } catch (error) {
    console.error('Error in competition leaderboard API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
