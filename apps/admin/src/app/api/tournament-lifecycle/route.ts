import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create Supabase client inside the function to ensure fresh env vars
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log('[Lifecycle API] Starting tournament fetch...');
    console.log('[Lifecycle API] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('[Lifecycle API] Using service role key:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...');

    // Fetch all tournaments ordered by start date
    console.log('[Lifecycle API] Executing query: SELECT * FROM tournaments ORDER BY start_date ASC');
    
    // Add timestamp to bust Supabase PostgREST cache
    const cacheBuster = Date.now();
    let { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(1000)
      .eq('is_visible', true) // Force query to be different
      .or(`is_visible.eq.true,is_visible.is.null`); // Include null values too

    if (tournamentsError) {
      console.error('[Lifecycle API] Error fetching tournaments:', tournamentsError);
      return NextResponse.json(
        { error: 'Failed to fetch tournaments', details: tournamentsError.message },
        { status: 500 }
      );
    }

    console.log(`[Lifecycle API] Query returned ${tournaments?.length || 0} tournaments`);
    
    tournaments?.forEach(t => {
      console.log(`  - ${t.name} (${t.id})`);
    });

    // For each tournament, fetch counts
    const tournamentsWithStats = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        try {
          console.log(`[Lifecycle API] Fetching stats for ${tournament.name}...`);
          
          // Get golfer count
          const { count: golferCount, error: golferError } = await supabase
            .from('tournament_golfers')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          if (golferError) {
            console.error(`[Lifecycle API] Error fetching golfer count for ${tournament.name}:`, golferError);
          }

          // Get competition count
          let competitionCount = 0;
          const { count, error: compError } = await supabase
            .from('tournament_competitions')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);
          
          if (compError) {
            console.error(`[Lifecycle API] Error fetching competition count for ${tournament.name}:`, compError);
            competitionCount = 0;
          } else {
            competitionCount = count || 0;
          }

          // Get entry count
          const { count: entryCount, error: entryError } = await supabase
            .from('entries')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          if (entryError) {
            console.error(`[Lifecycle API] Error fetching entry count for ${tournament.name}:`, entryError);
          }

          // Normalize status values to match Lifecycle Manager expectations
          let normalizedStatus = tournament.status || 'upcoming';
          if (normalizedStatus === 'live') {
            normalizedStatus = 'in_progress';
          }

          return {
            ...tournament,
            golfer_count: golferCount || 0,
            competition_count: competitionCount,
            entry_count: entryCount || 0,
            // Ensure required fields have defaults and normalized values
            status: normalizedStatus,
            timezone: tournament.timezone || 'UTC',
            registration_opens_at: tournament.registration_opens_at || null,
            registration_closes_at: tournament.registration_closes_at || null,
          };
        } catch (err) {
          console.error(`[Lifecycle API] Error processing tournament ${tournament.name}:`, err);
          // Return tournament with default stats if there's an error
          return {
            ...tournament,
            golfer_count: 0,
            competition_count: 0,
            entry_count: 0,
            status: tournament.status || 'upcoming',
            timezone: tournament.timezone || 'UTC',
            registration_opens_at: tournament.registration_open_date || null,
            registration_closes_at: tournament.registration_close_date || null,
          };
        }
      })
    );

    console.log('[Lifecycle API] Successfully fetched all tournament stats');
    return NextResponse.json({ tournaments: tournamentsWithStats });
  } catch (error) {
    console.error('[Lifecycle API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
