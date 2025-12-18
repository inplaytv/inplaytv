import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY || 'ac7793fb5f617626ccc418008832';

export const dynamic = 'force-dynamic';

// GET /api/tournaments/[slug]/tee-times - Fetch tee times from DataGolf
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get tournament by slug
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time')
      .eq('slug', slug)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', slug);
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Determine tour from tournament data
    const description = tournament.description?.toLowerCase() || '';
    const name = tournament.name?.toLowerCase() || '';
    let tour = 'pga';
    
    if (description.includes('lpga') || name.includes('lpga')) {
      tour = 'lpga';
    } else if (description.includes('european') || name.includes('european') || description.includes('dp world') || description.includes('mauritius')) {
      tour = 'euro';
    } else if (description.includes('korn ferry')) {
      tour = 'kft';
    }

    console.log('🔍 Fetching tee times from DataGolf:', { tour, tournament: tournament.name });

    // Try field-updates endpoint (has tee times and field list)
    let datagolfUrl = `https://feeds.datagolf.com/field-updates?tour=${tour}&file_format=json&key=${DATAGOLF_API_KEY}`;
    
    // Make request to DataGolf API
    let response = await fetch(datagolfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('❌ DataGolf API error:', response.status);
      
      // Fallback: Return database golfers if DataGolf fails
      const { data: tournamentGolfers } = await supabase
        .from('tournament_golfers')
        .select('golfers(id, name, country)')
        .eq('tournament_id', tournament.id);
      
      const field = (tournamentGolfers || []).map((tg: any) => ({
        player_name: tg.golfers?.name,
        country: tg.golfers?.country
      }));
      
      return NextResponse.json({
        tournament: {
          name: tournament.name,
          startDate: tournament.start_date,
          endDate: tournament.end_date,
          round1_tee_time: tournament.round1_tee_time,
          round2_tee_time: tournament.round2_tee_time,
          round3_tee_time: tournament.round3_tee_time,
          round4_tee_time: tournament.round4_tee_time
        },
        field: field,
        message: `${field.length} players (DataGolf unavailable)`,
        source: 'database'
      });
    }

    // Parse DataGolf response
    const apiResponse: any = await response.json();
    
    console.log('✅ DataGolf response:', { 
      event_name: apiResponse.event_name, 
      field_count: apiResponse.field?.length,
      has_tee_times: apiResponse.field?.some((p: any) => p.tee_time)
    });
    
    // Extract field from field-updates
    const fieldData = apiResponse.field || [];
    const eventName = apiResponse.event_name || tournament.name;
    
    if (fieldData.length === 0) {
      return NextResponse.json({
        tournament: {
          name: tournament.name,
          startDate: tournament.start_date,
          endDate: tournament.end_date
        },
        field: [],
        message: 'No field information available yet',
        source: 'datagolf'
      });
    }

    // Determine current round (default to 1 if not started)
    const currentRound = apiResponse.current_round || 1;
    
    // Convert field data to tee times format
    const field = fieldData.map((player: any) => ({
      player_name: player.player_name || player.name,
      dg_id: player.dg_id,
      country: player.country,
      // Extract tee time for current round
      tee_time: player[`r${currentRound}_teetime`] || player.tee_time || null,
      r1_teetime: player.r1_teetime || null,
      r2_teetime: player.r2_teetime || null,
      r3_teetime: player.r3_teetime || null,
      r4_teetime: player.r4_teetime || null,
      round_status: player.round_status || 'Not started',
      course: player.course || null,
      start_hole: player.start_hole || 1
    }));

    return NextResponse.json({
      tournament: {
        name: tournament.name,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        location: tournament.location,
        round1_tee_time: tournament.round1_tee_time,
        round2_tee_time: tournament.round2_tee_time,
        round3_tee_time: tournament.round3_tee_time,
        round4_tee_time: tournament.round4_tee_time
      },
      field,
      eventInfo: {
        event_name: eventName,
        current_round: currentRound
      },
      lastUpdated: new Date().toISOString(),
      source: 'datagolf'
    });

  } catch (error: any) {
    console.error('❌ Error fetching tee times:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
