import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY || 'ac7793fb5f617626ccc418008832';

// GET /api/tournaments/[slug]/tee-times - Fetch tee times from DataGolf
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log('⏰ Fetching tee times for tournament slug:', slug);

    const supabase = createClient();
    
    // Get tournament by slug
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', slug);
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    console.log('✅ Tournament found:', tournament.name);

    // Determine tour from tournament data
    const description = tournament.description?.toLowerCase() || '';
    const name = tournament.name?.toLowerCase() || '';
    let tour = 'pga';
    
    if (description.includes('lpga') || name.includes('lpga')) {
      tour = 'lpga';
    } else if (description.includes('european') || name.includes('european') || description.includes('dp world')) {
      tour = 'euro';
    } else if (description.includes('korn ferry')) {
      tour = 'kft';
    }

    console.log('📡 DataGolf API Request for Tee Times:');
    console.log('  Tour:', tour);
    console.log('  Tournament:', tournament.name);

    // Fetch tee times from DataGolf
    const datagolfUrl = `https://feeds.datagolf.com/field-updates?tour=${tour}&file_format=json&key=${DATAGOLF_API_KEY}`;
    
    console.log('🌐 DataGolf URL:', datagolfUrl.replace(DATAGOLF_API_KEY, 'API_KEY_HIDDEN'));
    
    // Make request to DataGolf API
    const response = await fetch(datagolfUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('❌ DataGolf API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error details:', errorText);
      
      return NextResponse.json({
        error: 'Failed to fetch tee times from DataGolf',
        details: errorText,
        status: response.status
      }, { status: 500 });
    }

    // Parse DataGolf response
    const apiResponse: any = await response.json();
    
    console.log('📦 DataGolf tee times response structure:', {
      hasField: !!apiResponse.field,
      fieldLength: apiResponse.field?.length || 0,
      hasTeeSheet: !!apiResponse.tee_sheet,
      samplePlayer: apiResponse.field?.[0]
    });

    // Extract tee times data
    const field = apiResponse.field || [];
    const teeSheet = apiResponse.tee_sheet || {};
    
    if (field.length === 0) {
      console.log('⚠️ No field data returned from DataGolf');
      return NextResponse.json({
        tournament: {
          name: tournament.name,
          startDate: tournament.start_date,
          endDate: tournament.end_date
        },
        field: [],
        teeSheet: {},
        message: 'No tee times available yet',
        source: 'datagolf'
      });
    }

    console.log('✅ DataGolf returned field with', field.length, 'players');
    console.log('✅ Tee sheet data:', Object.keys(teeSheet).length, 'rounds');

    return NextResponse.json({
      tournament: {
        name: tournament.name,
        startDate: tournament.start_date,
        endDate: tournament.end_date,
        location: tournament.location
      },
      field,
      teeSheet,
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
