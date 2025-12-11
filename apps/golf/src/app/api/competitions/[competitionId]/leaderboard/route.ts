import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = await createServerClient();
    
    // Use admin client for querying profiles (bypasses RLS for public leaderboard data)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Get current user (optional - leaderboard can be public)
    const { data: { user } } = await supabase.auth.getUser();

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

    // Fetch all picks for these entries
    const entryIds = entries?.map(e => e.id) || [];
    
    // First get all picks
    const { data: allPicks, error: picksError } = await supabase
      .from('entry_picks')
      .select('entry_id, golfer_id, slot_position')
      .in('entry_id', entryIds);

    if (picksError) {
      console.error('❌ Error fetching picks:', picksError);
      return NextResponse.json({ error: 'Failed to fetch picks' }, { status: 500 });
    }

    // Get unique golfer IDs and user IDs
    const golferIdsSet = new Set(allPicks?.map(p => p.golfer_id) || []);
    const golferIds = Array.from(golferIdsSet);
    const userIds = Array.from(new Set(entries?.map(e => e.user_id) || []));

    // Get golfer details separately
    const { data: golfers, error: golfersError } = await supabase
      .from('golfers')
      .select('id, first_name, last_name, country')
      .in('id', golferIds);

    // Get user profiles (using admin client to bypass RLS)
    const { data: profiles, error: profilesError } = await adminClient
      .from('profiles')
      .select('id, username, display_name, first_name, last_name')
      .in('id', userIds);

    if (profilesError) {
      console.error('❌ Profile fetch error:', profilesError);
    }

    if (golfersError) {
      console.error('❌ Error fetching golfers:', golfersError);
    }

    // Create maps for golfer details and user profiles
    const golferMap = new Map(golfers?.map(g => [g.id, g]) || []);
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Group picks by entry_id and enrich with golfer data
    const picksByEntry: Record<string, any[]> = {};
    allPicks?.forEach(pick => {
      if (!picksByEntry[pick.entry_id]) {
        picksByEntry[pick.entry_id] = [];
      }
      const golferData = golferMap.get(pick.golfer_id);
      picksByEntry[pick.entry_id].push({
        golfer_id: pick.golfer_id,
        slot_position: pick.slot_position,
        golfers: golferData ? {
          id: golferData.id,
          first_name: golferData.first_name,
          last_name: golferData.last_name,
          country: golferData.country
        } : null
      });
    });
    
    console.log('📦 Picks grouped by entry:', Object.keys(picksByEntry).map(entryId => ({
      entryId,
      pickCount: picksByEntry[entryId].length
    })));

    // Format entries for leaderboard
    const leaderboardEntries = entries?.map((entry, index) => {
      const picks = picksByEntry[entry.id] || [];
      const userProfile = profileMap.get(entry.user_id);
      
      // Try display_name first, then construct from first/last names, then username, then fallback
      const username = userProfile?.display_name || 
                      (userProfile?.first_name && userProfile?.last_name 
                        ? `${userProfile.first_name} ${userProfile.last_name}`.trim() 
                        : null) ||
                      userProfile?.username || 
                      `User ${entry.user_id.substring(0, 8)}`;
      
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
        picks: picks,
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
