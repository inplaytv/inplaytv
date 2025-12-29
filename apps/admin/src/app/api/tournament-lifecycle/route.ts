import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Create NEW Supabase client with cache busting
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        db: { 
          schema: 'public',
        },
        auth: { 
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Request-ID': `lifecycle-${Date.now()}`, // Force unique request
          }
        },
        // Disable any client-side caching
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      }
    );

    console.log('[Lifecycle API] Starting tournament fetch...');
    
    // Fetch all tournaments ordered by start date - FORCE FRESH READ
    // Add timestamp to bust any caching
    const timestamp = Date.now();
    let { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true })
      .limit(1000);

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
      console.log(`    RAW STATUS FROM DB: "${t.status}"`);
      console.log(`    RAW tournament object keys:`, Object.keys(t));
    });

    // For each tournament, fetch counts
    const tournamentsWithStats = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        try {
          console.log(`[Lifecycle API] Fetching stats for ${tournament.name}...`);
          console.log(`[Lifecycle API] Tournament RAW status: "${tournament.status}"`);
          console.log(`[Lifecycle API] Tournament RAW data:`, JSON.stringify(tournament, null, 2));
          
          // Get golfer count
          const { count: golferCount, error: golferError } = await supabase
            .from('tournament_golfers')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          if (golferError) {
            console.error(`[Lifecycle API] Error fetching golfer count for ${tournament.name}:`, golferError);
          }

          // Get competition count (InPlay only, not ONE 2 ONE challenges)
          let competitionCount = 0;
          const { count, error: compError } = await supabase
            .from('tournament_competitions')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id)
            .eq('competition_format', 'inplay');
          
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

          // Use status as-is from database
          const normalizedStatus = tournament.status || 'upcoming';

          const result = {
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

          // DEBUG: Log what we're returning
          console.log(`[Lifecycle API] Returning for ${tournament.name}:`, {
            status: result.status,
            golfer_count: result.golfer_count
          });

          return result;
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
