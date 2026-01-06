import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

// CORS headers for admin app access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const supabase = createAdminClient(); // Fresh client per request
    
    // Join events with competitions and count entries
    const { data: events, error } = await supabase
      .from('clubhouse_events')
      .select(`
        id,
        name,
        slug,
        description,
        status,
        registration_opens_at,
        registration_closes_at,
        start_date,
        end_date,
        clubhouse_competitions (
          entry_credits,
          max_entries,
          id,
          assigned_golfer_group_id,
          golfer_groups!assigned_golfer_group_id (
            id,
            name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get entry counts for each competition
    const eventsWithCounts = await Promise.all((events || []).map(async (event: any) => {
      // Get ALL competitions for this event (now we create 5)
      const competitions = event.clubhouse_competitions || [];
      
      // Use first competition for basic data (they all share same credits/max)
      const firstComp = competitions[0];
      
      console.log('📊 Event:', event.name);
      console.log('   Competitions:', competitions.length);
      console.log('   First comp golfer_groups:', firstComp?.golfer_groups);
      
      let currentEntries = 0;
      if (competitions.length > 0) {
        // Count entries across ALL competitions for this event
        const competitionIds = competitions.map((c: any) => c.id);
        const { count } = await supabase
          .from('clubhouse_entries')
          .select('*', { count: 'exact', head: true })
          .in('competition_id', competitionIds);
        currentEntries = count || 0;
      }

      return {
        __system: 'clubhouse' as const, // System discriminator
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description,
        status: event.status,
        entry_credits: firstComp?.entry_credits || 0,
        max_entries: firstComp?.max_entries || 0,
        current_entries: currentEntries,
        // Frontend expects these field names for date parsing
        registration_opens: event.registration_opens_at,
        registration_closes: event.registration_closes_at,
        start_date: event.start_date,
        end_date: event.end_date,
        // Also include snake_case for consistency
        reg_open_at: event.registration_opens_at,
        reg_close_at: event.registration_closes_at,
        start_at: event.start_date,
        end_at: event.end_date,
        competitions_count: competitions.length, // Show how many competitions
        golfer_group: firstComp?.golfer_groups || null, // Include golfer group info
      };
    }));

    return NextResponse.json(eventsWithCounts, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient(); // Fresh client per request
    const body = await req.json();
    
    // Check if event with same name already exists
    const { data: existingEvent } = await supabase
      .from('clubhouse_events')
      .select('name')
      .eq('name', body.name)
      .maybeSingle();
    
    if (existingEvent) {
      console.warn('[Clubhouse Events API] Event with this name already exists:', body.name);
      return NextResponse.json(
        { error: `An event named "${body.name}" already exists. Please use a different name.` },
        { status: 400 }
      );
    }
    
    // Generate slug from name
    let slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    // Check if slug exists, append short UUID if collision (shouldn't happen now but safe)
    const { data: existingSlug } = await supabase
      .from('clubhouse_events')
      .select('slug')
      .eq('slug', slug)
      .maybeSingle();
    
    if (existingSlug) {
      // Append first 8 chars of UUID to make unique
      const uniqueSuffix = crypto.randomUUID().slice(0, 8);
      slug = `${slug}-${uniqueSuffix}`;
    }
    
    // Convert datetime-local to proper ISO timestamp
    // Browser sends: "2026-01-10T09:00" (no timezone)
    // PostgreSQL TIMESTAMPTZ needs proper ISO format
    const toISO = (dateStr: string) => {
      if (!dateStr) return null;
      // If already has timezone, return as-is
      if (dateStr.includes('Z') || dateStr.includes('+') || dateStr.match(/[+-]\d{2}:\d{2}$/)) {
        return dateStr;
      }
      // Parse as local time and convert to ISO string (includes timezone)
      const date = new Date(dateStr);
      return date.toISOString();
    };
    

    // Calculate registration close times (15 minutes before each round)
    const subtract15Minutes = (dateStr: string) => {
      const date = new Date(dateStr);
      date.setMinutes(date.getMinutes() - 15);
      return date.toISOString();
    };

    // Create event with round tee times
    const { data: event, error: eventError } = await supabase
      .from('clubhouse_events')
      .insert({
        name: body.name,
        slug: slug,
        description: body.description || null,
        location: body.location || null,
        start_date: toISO(body.round1_tee_time), // Event starts with Round 1
        end_date: toISO(body.end_date),
        registration_opens_at: toISO(body.registration_opens),
        registration_closes_at: subtract15Minutes(body.round4_tee_time), // Closes 15min before LAST round tee-off
        round1_tee_time: toISO(body.round1_tee_time),
        round2_tee_time: toISO(body.round2_tee_time),
        round3_tee_time: toISO(body.round3_tee_time),
        round4_tee_time: toISO(body.round4_tee_time),
        linked_tournament_id: body.linked_tournament_id || null, // Option A: Link to InPlay tournament
      })
      .select()
      .single();

    if (eventError) {
      console.error('[Clubhouse Events API] Event creation error:', eventError);
      throw eventError;
    }

    // Create 5 competitions automatically
    const competitions = [
      {
        name: `${body.name} - All Four Rounds`,
        rounds_covered: [1, 2, 3, 4],
        starts_at: toISO(body.round1_tee_time),
        closes_at: subtract15Minutes(body.round1_tee_time),
      },
      {
        name: `${body.name} - Round 1`,
        rounds_covered: [1],
        starts_at: toISO(body.round1_tee_time),
        closes_at: subtract15Minutes(body.round1_tee_time),
      },
      {
        name: `${body.name} - Round 2`,
        rounds_covered: [2],
        starts_at: toISO(body.round2_tee_time),
        closes_at: subtract15Minutes(body.round2_tee_time),
      },
      {
        name: `${body.name} - Round 3`,
        rounds_covered: [3],
        starts_at: toISO(body.round3_tee_time),
        closes_at: subtract15Minutes(body.round3_tee_time),
      },
      {
        name: `${body.name} - Round 4`,
        rounds_covered: [4],
        starts_at: toISO(body.round4_tee_time),
        closes_at: subtract15Minutes(body.round4_tee_time),
      },
    ];

    const competitionsToInsert = competitions.map(comp => ({
      event_id: event.id,
      name: comp.name,
      description: body.description || null,
      entry_credits: body.entry_credits || 0,
      prize_credits: null,
      max_entries: body.max_entries || 100,
      opens_at: toISO(body.registration_opens),
      closes_at: comp.closes_at,
      starts_at: comp.starts_at,
      rounds_covered: comp.rounds_covered,
      assigned_golfer_group_id: body.assigned_golfer_group_id || null,
    }));

    const { error: compError } = await supabase
      .from('clubhouse_competitions')
      .insert(competitionsToInsert);

    if (compError) {
      console.error('[Clubhouse Events API] Competition creation error:', compError);
      throw compError;
    }

    return NextResponse.json({ ...event, __system: 'clubhouse' as const }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[Clubhouse Events API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
