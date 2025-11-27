import { NextResponse } from 'next/server';

interface TournamentField {
  dg_id: number;
  player_name: string;
  country: string;
  pga_number?: number;
  r1_teetime?: string;
  start_hole?: number;
  dk_salary?: number;
  fd_salary?: number;
  unofficial?: number;
  am?: number;
}

/**
 * Fetches the field list (golfers) for a specific tournament from DataGolf
 * Uses the field-updates endpoint which provides:
 * - Player list with DataGolf IDs
 * - Tee times
 * - DFS salaries
 * - Amateur status
 * - WD status
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tour = searchParams.get('tour') || 'pga'; // pga, euro, kft, alt
  
  const apiKey = process.env.DATAGOLF_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'DataGolf API key not configured' },
      { status: 500 }
    );
  }

  try {
    console.log(`🏌️ Fetching field for ${tour.toUpperCase()} Tour...`);
    
    const response = await fetch(
      `https://feeds.datagolf.com/field-updates?tour=${tour}&file_format=json&key=${apiKey}`,
      { 
        next: { revalidate: 600 } // Cache for 10 minutes (field updates frequently)
      }
    );

    if (!response.ok) {
      throw new Error(`DataGolf API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // DataGolf returns: { event_name, course_name, current_round, field: [...] }
    if (!data.field || data.field.length === 0) {
      return NextResponse.json({
        success: true,
        eventName: data.event_name || 'No Event',
        courseName: data.course_name,
        currentRound: data.current_round,
        golfers: [],
        message: 'No field data available for current tournament'
      });
    }

    // Map DataGolf field data to our format
    const golfers = data.field.map((player: TournamentField) => ({
      dgId: player.dg_id,
      name: player.player_name,
      country: player.country,
      pgaNumber: player.pga_number,
      teeTime: player.r1_teetime,
      startHole: player.start_hole,
      dkSalary: player.dk_salary,
      fdSalary: player.fd_salary,
      isAmateur: player.am === 1,
      isUnofficial: player.unofficial === 1,
    }));

    console.log(`✅ Found ${golfers.length} golfers in ${data.event_name}`);

    return NextResponse.json({
      success: true,
      eventName: data.event_name,
      courseName: data.course_name,
      currentRound: data.current_round,
      golfers,
      count: golfers.length,
    });

  } catch (error) {
    console.error('❌ Error fetching tournament field:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch tournament field' 
      },
      { status: 500 }
    );
  }
}
