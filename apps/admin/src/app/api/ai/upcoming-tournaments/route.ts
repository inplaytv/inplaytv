import { NextResponse } from 'next/server';

interface UpcomingTournament {
  id: string;
  name: string;
  tour: 'PGA' | 'LPGA' | 'European' | 'euro'; // 'euro' for database compatibility
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
}

// No fallback data - system now relies entirely on DataGolf API

async function fetchFromDataGolf(): Promise<UpcomingTournament[]> {
  const apiKey = process.env.DATAGOLF_API_KEY;
  
  if (!apiKey) {
    throw new Error('DataGolf API key is required. Please add DATAGOLF_API_KEY to your environment variables.');
  }

  try {
    const tournaments: UpcomingTournament[] = [];
    const today = new Date();

    // Fetch PGA Tour schedule
    const pgaRes = await fetch(
      `https://feeds.datagolf.com/get-schedule?tour=pga&file_format=json&key=${apiKey}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (pgaRes.ok) {
      const pgaData = await pgaRes.json();
      // Don't filter here - let the outer filter handle date filtering
      pgaData.schedule.forEach((t: any, index: number) => {
        // Calculate end date as 4 days after start (typical golf tournament)
        const startDate = new Date(t.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4);
        const endDateString = endDate.toISOString().split('T')[0];
        
        // Use event_id if available, otherwise use index to ensure unique keys
        const eventId = t.event_id && t.event_id !== 'TBD' 
          ? t.event_id 
          : `${t.start_date}-${index}`;
        
        tournaments.push({
          id: `pga-${eventId}`,
          name: t.event_name,
          tour: 'PGA',
          startDate: t.start_date,
          endDate: endDateString,
          location: t.location || 'TBD',
          venue: t.course || 'TBD',
        });
      });
    }

    // Fetch European Tour schedule
    const euroRes = await fetch(
      `https://feeds.datagolf.com/get-schedule?tour=euro&file_format=json&key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    
    if (euroRes.ok) {
      const euroData = await euroRes.json();
      // Don't filter here - let the outer filter handle date filtering
      euroData.schedule.forEach((t: any, index: number) => {
        // Calculate end date as 4 days after start (typical golf tournament)
        const startDate = new Date(t.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4);
        const endDateString = endDate.toISOString().split('T')[0];
        
        // Use event_id if available, otherwise use index to ensure unique keys
        const eventId = t.event_id && t.event_id !== 'TBD' 
          ? t.event_id 
          : `${t.start_date}-${index}`;
        
        tournaments.push({
          id: `euro-${eventId}`,
          name: t.event_name,
          tour: 'euro',
          startDate: t.start_date,
          endDate: endDateString,
          location: t.location || 'TBD',
          venue: t.course || 'TBD',
        });
      });
    }

    console.log(`✅ Fetched ${tournaments.length} tournaments from DataGolf`);
    
    if (tournaments.length === 0) {
      throw new Error('No tournaments returned from DataGolf API');
    }
    
    return tournaments;
    
  } catch (error) {
    console.error('❌ Error fetching from DataGolf:', error);
    throw error;
  }
}

export async function GET() {
  try {
    // Fetch from DataGolf
    const allTournaments = await fetchFromDataGolf();
    
    // Filter to show only upcoming tournaments (today or future)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const availableTournaments = allTournaments.filter((tournament) => {
      const tournamentStartDate = new Date(tournament.startDate);
      tournamentStartDate.setHours(0, 0, 0, 0);
      // Include only tournaments that start today or in the future
      return tournamentStartDate >= today;
    });

    // Sort by start date
    availableTournaments.sort((a, b) => {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });

    console.log('📅 Returning upcoming tournaments (today + future):', availableTournaments.length);

    return NextResponse.json({
      success: true,
      tournaments: availableTournaments,
    });
  } catch (error) {
    console.error('❌ Error fetching upcoming tournaments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}
