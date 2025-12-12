import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[Lifecycle API] Starting tournament fetch...');

    // Fetch all tournaments ordered by start date
    const { data: tournaments, error: tournamentsError } = await supabase
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

    console.log(`[Lifecycle API] Found ${tournaments?.length || 0} tournaments`);

    // For each tournament, fetch counts
    const tournamentsWithStats = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        console.log(`[Lifecycle API] Fetching stats for ${tournament.name}...`);
        
        // Get golfer count
        const { count: golferCount, error: golferError } = await supabase
          .from('tournament_golfers')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        if (golferError) {
          console.error(`[Lifecycle API] Error fetching golfer count for ${tournament.name}:`, golferError);
        }

        // Get competition count - check if table exists first
        let competitionCount = 0;
        const { count, error: compError } = await supabase
          .from('tournament_competitions')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);
        
        if (compError) {
          console.error(`[Lifecycle API] Error fetching competition count for ${tournament.name}:`, compError);
          // Competition table might not exist or might have different name
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
