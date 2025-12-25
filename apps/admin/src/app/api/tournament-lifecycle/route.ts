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
    
    // Direct query for GREENIDGE OPEN to test
    const { data: greenidgeTest, error: greenidgeError } = await supabase
      .from('tournaments')
      .select('id, name, start_date')
      .eq('id', 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084')
      .single();
    console.log('[Lifecycle API] Direct GREENIDGE query result:', greenidgeTest ? `Found: ${greenidgeTest.name}` : 'NOT FOUND', greenidgeError ? `Error: ${greenidgeError.message}` : '');
    
    let { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true });

    if (tournamentsError) {
      console.error('[Lifecycle API] Error fetching tournaments:', tournamentsError);
      return NextResponse.json(
        { error: 'Failed to fetch tournaments', details: tournamentsError.message },
        { status: 500 }
      );
    }

    console.log(`[Lifecycle API] Query returned ${tournaments?.length || 0} tournaments`);
    
    // WORKAROUND: If GREENIDGE OPEN is missing, fetch it directly and append
    const greenidgeExists = tournaments?.find(t => t.id === 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084');
    if (!greenidgeExists) {
      console.log('[Lifecycle API] GREENIDGE OPEN missing - fetching directly...');
      const { data: greenidge, error: greenidgeError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084')
        .single();
      
      if (greenidge && !greenidgeError) {
        tournaments = [...(tournaments || []), greenidge];
        console.log('[Lifecycle API] GREENIDGE OPEN added via workaround');
      } else {
        console.error('[Lifecycle API] Failed to fetch GREENIDGE OPEN:', greenidgeError);
      }
    } else {
      console.log('[Lifecycle API] GREENIDGE OPEN found in results');
    }
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
