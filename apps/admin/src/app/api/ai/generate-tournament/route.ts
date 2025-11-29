import { NextRequest, NextResponse } from 'next/server';

interface CompetitionSuggestion {
  name: string;
  type: string;
  entryFee: number;
  entrantsCap: number;
  adminFeePercent: number;
  regOpenAt: string;
  regCloseAt: string;
}

interface TournamentGeneration {
  slug: string;
  competitions: CompetitionSuggestion[];
  suggestedGolferGroup: string;
  imageUrl: string;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim();
}

function calculateRegDates(startDate: string): { regOpenAt: string; regCloseAt: string } {
  const start = new Date(startDate);
  
  // Registration opens 6 days before tournament
  const regOpen = new Date(start);
  regOpen.setDate(regOpen.getDate() - 6);
  
  // Registration closes at 6:30 AM on tournament day (most tournaments start ~7 AM)
  const regClose = new Date(start);
  regClose.setHours(6, 30, 0, 0);
  
  return {
    regOpenAt: regOpen.toISOString(),
    regCloseAt: regClose.toISOString(),
  };
}

function generateCompetitions(
  tournament: {
    name: string;
    tour: string;
    startDate: string;
    endDate: string;
    round1_tee_time?: string;
    round2_tee_time?: string;
    round3_tee_time?: string;
    round4_tee_time?: string;
  }
): CompetitionSuggestion[] {
  const { regOpenAt } = calculateRegDates(tournament.startDate);
  const startDate = new Date(tournament.startDate);
  
  // Calculate round-based registration close times
  // If tee times available from DataGolf, use them minus 15 minutes
  // Otherwise fall back to 6:30 AM on the day each round starts
  
  const round1Close = tournament.round1_tee_time 
    ? new Date(new Date(tournament.round1_tee_time).getTime() - 15 * 60000) // 15 minutes before tee time
    : (() => {
        const d = new Date(startDate);
        d.setHours(6, 30, 0, 0);
        return d;
      })();
  
  const round2Close = tournament.round2_tee_time
    ? new Date(new Date(tournament.round2_tee_time).getTime() - 15 * 60000)
    : (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 1);
        d.setHours(6, 30, 0, 0);
        return d;
      })();
  
  const round3Close = tournament.round3_tee_time
    ? new Date(new Date(tournament.round3_tee_time).getTime() - 15 * 60000)
    : (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 2);
        d.setHours(6, 30, 0, 0);
        return d;
      })();
  
  const round4Close = tournament.round4_tee_time
    ? new Date(new Date(tournament.round4_tee_time).getTime() - 15 * 60000)
    : (() => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 3);
        d.setHours(6, 30, 0, 0);
        return d;
      })();
  
  // Determine if this is a major tournament
  const isMajor = 
    tournament.name.includes('Masters') ||
    tournament.name.includes('PGA Championship') ||
    tournament.name.includes('U.S. Open') ||
    tournament.name.includes('Open Championship') ||
    tournament.name.includes('British Open') ||
    tournament.name.includes('Women\'s PGA') ||
    tournament.name.includes('Women\'s Open');
  
  // Base entry fee based on tour and prestige
  let baseFee = 10;
  if (tournament.tour === 'LPGA') baseFee = 8;
  if (tournament.tour === 'European') baseFee = 12;
  if (isMajor) baseFee *= 2;
  
  // Standard 6 competitions for all tournaments
  const competitions: CompetitionSuggestion[] = [
    {
      name: 'Full Course',
      type: 'full_course',
      entryFee: baseFee,
      entrantsCap: 1000,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round1Close.toISOString(), // Closes before Round 1
    },
    {
      name: 'First To Strike',
      type: 'first_to_strike',
      entryFee: Math.round(baseFee * 0.3),
      entrantsCap: 600,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round1Close.toISOString(), // Closes before Round 1
    },
    {
      name: 'Beat The Cut',
      type: 'beat_the_cut',
      entryFee: Math.round(baseFee * 0.6),
      entrantsCap: 750,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round1Close.toISOString(), // Closes before Round 1
    },
    {
      name: 'THE WEEKENDER',
      type: 'the_weekender',
      entryFee: Math.round(baseFee * 0.7),
      entrantsCap: 800,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round3Close.toISOString(), // Closes before Round 3
    },
    {
      name: 'Final Strike',
      type: 'final_strike',
      entryFee: Math.round(baseFee * 0.5),
      entrantsCap: 650,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round4Close.toISOString(), // Closes before Round 4
    },
    {
      name: 'ONE 2 ONE',
      type: 'one_2_one',
      entryFee: Math.round(baseFee * 0.4),
      entrantsCap: 500,
      adminFeePercent: 10,
      regOpenAt,
      regCloseAt: round1Close.toISOString(), // Closes before Round 1
    },
  ];
  
  return competitions;
}

function suggestGolferGroup(tournament: { name: string; tour: string }): string {
  // Default to all qualified golfers for the tournament
  // This can be customized later if tier-based assignment is needed
  return 'All Qualified Golfers';
}

async function fetchTournamentImage(tournamentName: string, venue: string): Promise<string> {
  try {
    // In production, you would use Unsplash API:
    // const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
    // const searchQuery = `${venue} golf course`;
    // const response = await fetch(
    //   `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`
    // );
    // const data = await response.json();
    // return data.results[0]?.urls?.regular || fallbackImage;
    
    // For now, return a placeholder based on tournament type
    const fallbackImages = {
      'Masters': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=500&fit=crop',
      'PGA': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=500&fit=crop',
      'US Open': 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&h=500&fit=crop',
      'Open Championship': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=500&fit=crop',
      'LPGA': 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=500&fit=crop',
      'European': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=500&fit=crop',
      'default': 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=500&fit=crop',
    };
    
    // Find matching image
    for (const [key, url] of Object.entries(fallbackImages)) {
      if (tournamentName.includes(key)) {
        return url;
      }
    }
    
    return fallbackImages.default;
  } catch (error) {
    console.error('Error fetching tournament image:', error);
    return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=500&fit=crop';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournament } = body;
    
    if (!tournament || !tournament.name || !tournament.startDate) {
      return NextResponse.json(
        { success: false, error: 'Invalid tournament data' },
        { status: 400 }
      );
    }
    
    console.log('🤖 Generating AI suggestions for:', tournament.name);
    
    // Generate slug
    const slug = generateSlug(tournament.name);
    
    // Generate competitions
    const competitions = generateCompetitions(tournament);
    
    // Suggest golfer group
    const suggestedGolferGroup = suggestGolferGroup(tournament);
    
    // Fetch tournament image
    const imageUrl = await fetchTournamentImage(tournament.name, tournament.venue);
    
    const generation: TournamentGeneration = {
      slug,
      competitions,
      suggestedGolferGroup,
      imageUrl,
    };
    
    console.log('✅ Generated:', {
      slug,
      competitionsCount: competitions.length,
      golferGroup: suggestedGolferGroup,
    });
    
    return NextResponse.json({
      success: true,
      generation,
    });
  } catch (error) {
    console.error('❌ Error generating tournament:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate tournament' },
      { status: 500 }
    );
  }
}
