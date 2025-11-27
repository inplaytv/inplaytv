import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Pre-schedule future tournaments from DataGolf
 * This creates tournament records in advance (without golfers)
 * Golfers can be synced later when field is announced
 * 
 * POST /api/ai/schedule-tournaments
 * Body: { 
 *   tour: 'pga' | 'euro',
 *   createAll: boolean,
 *   tournamentIds?: string[] // specific event IDs to create
 * }
 */
export async function POST(request: Request) {
  try {
    const { tour = 'pga', createAll = false, tournamentIds } = await request.json();

    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    console.log(`📅 Fetching ${tour.toUpperCase()} Tour schedule...`);

    // Fetch full season schedule
    const response = await fetch(
      `https://feeds.datagolf.com/get-schedule?tour=${tour}&file_format=json&key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );

    if (!response.ok) {
      throw new Error(`DataGolf API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.schedule || data.schedule.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No tournaments found in schedule',
      });
    }

    console.log(`✅ Found ${data.schedule.length} tournaments in ${data.tour.toUpperCase()} schedule`);

    // Filter tournaments to schedule
    let tournamentsToSchedule = data.schedule;
    
    if (!createAll && tournamentIds) {
      // Only create specific tournaments
      tournamentsToSchedule = data.schedule.filter((t: any) => 
        tournamentIds.includes(t.event_id.toString())
      );
    }

    // Filter out tournaments that already exist
    const existingTournaments = await supabase
      .from('tournaments')
      .select('slug')
      .like('slug', `%${tour}%`);

    const existingSlugs = new Set(
      existingTournaments.data?.map(t => t.slug) || []
    );

    const created = [];
    const skipped = [];
    const errors = [];

    for (const tournament of tournamentsToSchedule) {
      try {
        // Generate slug from event name and ID
        const slug = `${tournament.event_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')}-${tour}-${tournament.event_id}`;

        // Check if already exists
        if (existingSlugs.has(slug)) {
          skipped.push({
            name: tournament.event_name,
            reason: 'Already exists',
          });
          continue;
        }

        // Calculate end date (assume 4-day tournament)
        const startDate = new Date(tournament.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 3); // Thursday-Sunday

        // Create tournament record (without golfers initially)
        const { data: newTournament, error: createError } = await supabase
          .from('tournaments')
          .insert({
            name: tournament.event_name,
            slug,
            start_date: tournament.start_date,
            end_date: endDate.toISOString().split('T')[0],
            location: `${tournament.course || 'TBD'}, ${tournament.location || 'TBD'}`,
            description: `${tour.toUpperCase()} Tour - ${tournament.event_name}`,
            image_url: `https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=400&fit=crop`,
            status: 'upcoming',
            timezone: tournament.location?.includes('Europe') ? 'Europe/London' : 'America/New_York',
            admin_fee_percent: 10.00,
            is_visible: false, // Hidden until competitions and golfers are added
          })
          .select()
          .single();

        if (createError) {
          errors.push({
            name: tournament.event_name,
            error: createError.message,
          });
          continue;
        }

        created.push({
          id: newTournament.id,
          name: newTournament.name,
          slug: newTournament.slug,
          startDate: newTournament.start_date,
          dgEventId: tournament.event_id,
        });

        console.log(`✅ Scheduled: ${tournament.event_name}`);

      } catch (error) {
        errors.push({
          name: tournament.event_name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      tour: data.tour,
      season: data.current_season,
      created: created.length,
      skipped: skipped.length,
      errors: errors.length,
      tournaments: created,
      skippedList: skipped,
      errorList: errors,
    });

  } catch (error) {
    console.error('❌ Error scheduling tournaments:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to schedule tournaments' 
      },
      { status: 500 }
    );
  }
}

/**
 * Get full season schedule without creating tournaments
 * GET /api/ai/schedule-tournaments?tour=pga
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get('tour') || 'pga';

    const apiKey = process.env.DATAGOLF_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'DataGolf API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://feeds.datagolf.com/get-schedule?tour=${tour}&file_format=json&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    );

    if (!response.ok) {
      throw new Error(`DataGolf API returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      tour: data.tour,
      season: data.current_season,
      totalTournaments: data.schedule.length,
      schedule: data.schedule.map((t: any) => ({
        eventId: t.event_id,
        name: t.event_name,
        startDate: t.start_date,
        location: t.location,
        course: t.course,
        coordinates: {
          latitude: t.latitude,
          longitude: t.longitude,
        },
      })),
    });

  } catch (error) {
    console.error('❌ Error fetching schedule:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch schedule' 
      },
      { status: 500 }
    );
  }
}
