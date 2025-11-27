import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATAGOLF_API_KEY = process.env.DATAGOLF_API_KEY || 'ac7793fb5f617626ccc418008832';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // No caching - always fetch fresh data

interface DataGolfLeaderboard {
  event_id?: string;
  player_name?: string;
  dg_id?: number;
  position?: string;
  current_pos?: string;
  total_score?: number;
  current_score?: number;
  thru?: string | number;
  today?: number;
  R1?: number;
  R2?: number;
  R3?: number;
  R4?: number;
  r1?: number;
  r2?: number;
  r3?: number;
  r4?: number;
  country?: string;
  [key: string]: any; // Allow any other properties
}

interface FormattedGolfer {
  position: string;
  name: string;
  country: string;
  score: number;
  today: number;
  thru: string | number;
  rounds: {
    r1: number | null;
    r2: number | null;
    r3: number | null;
    r4: number | null;
  };
}

// GET /api/tournaments/[slug]/live-scores - Fetch real-time scores from DataGolf
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log('🔴 LIVE: Fetching real-time scores for:', params.slug);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it looks like a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.slug);
    
    // Get tournament from database to find DataGolf event_id
    let query = supabase
      .from('tournaments')
      .select('id, name, slug, status');
    
    if (isUuid) {
      // Try as UUID first
      query = query.eq('id', params.slug);
    } else {
      // Try by slug
      query = query.eq('slug', params.slug);
    }
    
    const { data: tournament, error: tournamentError } = await query.single();

    if (tournamentError || !tournament) {
      console.error('❌ Tournament not found:', tournamentError);
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Map tournament name/slug to DataGolf event_id
    // Use 2025 for current season tournaments
    let eventId = 'rsm-classic-2025'; // Default for RSM Classic 2025
    
    const tournamentName = tournament.name.toLowerCase();
    const tournamentSlug = tournament.slug?.toLowerCase() || '';
    
    // Map common tournaments to DataGolf event IDs
    if (tournamentName.includes('rsm') || tournamentSlug.includes('rsm')) {
      eventId = 'rsm-classic-2025';
    } else if (tournamentName.includes('hero world')) {
      eventId = 'hero-world-challenge-2024';
    } else if (tournamentName.includes('masters')) {
      eventId = 'the-masters-2025';
    }
    // Add more tournament mappings as needed
    
    console.log('📡 DataGolf API Request Details:');
    console.log('   Tournament Name:', tournament.name);
    console.log('   Tournament Slug:', tournament.slug);
    console.log('   Event ID:', eventId);
    console.log('   Tournament Status:', tournament.status);

    // Fetch live scores from DataGolf using the in-play predictions endpoint
    // This provides real-time scores updated every 5 minutes
    const datagolfUrl = `https://feeds.datagolf.com/preds/in-play?tour=pga&file_format=json&key=${DATAGOLF_API_KEY}`;
    
    console.log('🌐 DataGolf URL:', datagolfUrl.replace(DATAGOLF_API_KEY, 'API_KEY_HIDDEN'));
    console.log('🕐 Fetching at:', new Date().toISOString());
    
    const response = await fetch(datagolfUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store' // Don't cache - always fetch fresh data
    });

    if (!response.ok) {
      console.error('❌ DataGolf API error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return NextResponse.json({ 
        error: 'Failed to fetch live scores from DataGolf',
        details: errorText 
      }, { status: response.status });
    }

    const apiResponse: { 
      info?: {
        current_round?: number;
        event_name?: string;
        last_update?: string;
      };
      data?: DataGolfLeaderboard[];
    } = await response.json();
    
    console.log('📦 DataGolf response structure:', {
      hasInfo: !!apiResponse.info,
      hasData: !!apiResponse.data,
      dataLength: apiResponse.data?.length || 0,
      keys: Object.keys(apiResponse),
      eventName: apiResponse.info?.event_name,
      currentRound: apiResponse.info?.current_round,
      lastUpdated: apiResponse.info?.last_update
    });
    
    // Log a sample golfer to see the data structure
    const sampleGolfer = apiResponse.data?.[0];
    if (sampleGolfer) {
      console.log('📊 Sample golfer data:', JSON.stringify(sampleGolfer, null, 2));
    }
    
    // The in-play endpoint returns data in the 'data' array
    let leaderboardData = apiResponse.data || [];
    
    // No need to filter - in-play endpoint only returns golfers currently playing
    
    console.log('✅ DataGolf returned', leaderboardData.length, 'golfers playing in tournament');

    if (leaderboardData.length === 0) {
      console.log('⚠️ No golfers in DataGolf in-play - trying historical endpoint for completed tournament...');
      
      // Try historical data endpoint for completed tournaments
      const historicalUrl = `https://feeds.datagolf.com/historical-raw-data/event-results?tour=pga&event_id=${eventId}&file_format=json&key=${DATAGOLF_API_KEY}`;
      console.log('🌐 Fetching historical data:', historicalUrl.replace(DATAGOLF_API_KEY, 'API_KEY_HIDDEN'));
      
      try {
        const historicalResponse = await fetch(historicalUrl, {
          headers: { 'Accept': 'application/json' },
          cache: 'no-store'
        });
        
        if (historicalResponse.ok) {
          const historicalData = await historicalResponse.json();
          console.log('📦 Historical data response:', {
            hasData: !!historicalData,
            dataKeys: historicalData ? Object.keys(historicalData) : []
          });
          
          if (historicalData && historicalData.results && historicalData.results.length > 0) {
            console.log('✅ Found', historicalData.results.length, 'golfers in historical data');
            leaderboardData = historicalData.results;
          }
        }
      } catch (histError) {
        console.error('❌ Historical data fetch failed:', histError);
      }
      
      if (leaderboardData.length === 0) {
        console.log('⚠️ No data from either endpoint');
        return NextResponse.json({
          tournament: {
            id: tournament.id,
            name: tournament.name,
            status: tournament.status,
          },
          leaderboard: [],
          source: 'datagolf',
          lastUpdated: new Date().toISOString(),
          eventId: eventId,
          message: 'No live scores available - tournament may have ended or not started yet'
        });
      }
    }

    // Format the leaderboard data
    const leaderboard = leaderboardData.map((entry: DataGolfLeaderboard) => {
      // Calculate toPar (DataGolf provides total_score or current_score which is relative to par)
      const toPar = entry.total_score || entry.current_score || 0;
      
      // Build rounds array - include all non-null rounds
      const roundsArray = [];
      if (entry.R1 !== null && entry.R1 !== undefined) roundsArray.push(entry.R1 || entry.r1);
      if (entry.R2 !== null && entry.R2 !== undefined) roundsArray.push(entry.R2 || entry.r2);
      if (entry.R3 !== null && entry.R3 !== undefined) roundsArray.push(entry.R3 || entry.r3);
      if (entry.R4 !== null && entry.R4 !== undefined) roundsArray.push(entry.R4 || entry.r4);
      
      // Position can be in position or current_pos
      const position = entry.position || entry.current_pos || '-';

      return {
        id: (entry.dg_id || 0).toString(),
        name: entry.player_name || 'Unknown',
        country: entry.country || 'USA',
        position: position,
        score: entry.total_score || entry.current_score || 0,
        toPar: toPar,
        today: entry.today || 0,
        thru: entry.thru || '-',
        rounds: roundsArray,
        // Include raw round scores for hole-by-hole calculation
        r1: entry.R1 || entry.r1,
        r2: entry.R2 || entry.r2,
        r3: entry.R3 || entry.r3,
        r4: entry.R4 || entry.r4,
      };
    });

    // Sort by position
    leaderboard.sort((a: any, b: any) => {
      const posA = a.position === 'CUT' ? 999 : (a.position === '-' ? 1000 : parseInt(a.position));
      const posB = b.position === 'CUT' ? 999 : (b.position === '-' ? 1000 : parseInt(b.position));
      return posA - posB;
    });

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
      },
      leaderboard,
      source: 'datagolf',
      lastUpdated: new Date().toISOString(),
      eventId: eventId
    });

  } catch (error) {
    console.error('❌ Error in live-scores endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
