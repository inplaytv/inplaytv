import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
  default_entry_fee_pennies: number | null;
  default_entrants_cap: number | null;
  default_admin_fee_percent: number | null;
  default_reg_open_days_before: number | null;
  round_start: number | null;
}

interface CompetitionSuggestion {
  name: string;
  type: string;
  typeId: string;
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

function calculateRegDates(startDate: string, daysBeforeStart: number = 6): { regOpenAt: string } {
  const start = new Date(startDate);
  
  // Registration opens N days before tournament
  const regOpen = new Date(start);
  regOpen.setDate(regOpen.getDate() - daysBeforeStart);
  
  return {
    regOpenAt: regOpen.toISOString(),
  };
}

async function generateCompetitions(
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
): Promise<CompetitionSuggestion[]> {
  console.log('🔍 Fetching competition types from database...');
  
  // Fetch competition types from database (no status filter - column doesn't exist)
  const { data: competitionTypes, error } = await supabase
    .from('competition_types')
    .select('*')
    .order('created_at');

  if (error) {
    console.error('❌ Database error fetching competition types:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }

  if (!competitionTypes || competitionTypes.length === 0) {
    console.error('❌ No competition types found in database');
    console.log('📊 Returning empty array - check database has active competition types');
    return [];
  }

  console.log(`✅ Fetched ${competitionTypes.length} active competition types from database`);
  console.log('📋 Competition types:', competitionTypes.map(ct => ct.name).join(', '));

  const startDate = new Date(tournament.startDate);
  const competitions: CompetitionSuggestion[] = [];

  // Calculate round close times from tournament round_X_tee_time
  // Closes 15 minutes before each round starts
  const getRoundCloseTime = (roundTeeTime: string | undefined, dayOffset: number): Date => {
    if (roundTeeTime) {
      const closeTime = new Date(roundTeeTime);
      closeTime.setMinutes(closeTime.getMinutes() - 15);
      return closeTime;
    }
    // Fallback: 6:30 AM on the day the round starts
    const fallback = new Date(startDate);
    fallback.setDate(fallback.getDate() + dayOffset);
    fallback.setHours(6, 30, 0, 0);
    return fallback;
  };

  const round1Close = getRoundCloseTime(tournament.round1_tee_time, 0);
  const round2Close = getRoundCloseTime(tournament.round2_tee_time, 1);
  const round3Close = getRoundCloseTime(tournament.round3_tee_time, 2);
  const round4Close = getRoundCloseTime(tournament.round4_tee_time, 3);

  const roundCloseTimes = [round1Close, round2Close, round3Close, round4Close];

  for (const compType of competitionTypes) {
    // Determine registration close time based on round_start
    let regCloseAt: Date;
    
    if (compType.round_start && compType.round_start >= 1 && compType.round_start <= 4) {
      // Close before the starting round
      regCloseAt = roundCloseTimes[compType.round_start - 1]; // Array is 0-indexed
    } else {
      // Default to closing before Round 1
      regCloseAt = round1Close;
    }

    // Calculate registration open time
    const daysBeforeStart = compType.default_reg_open_days_before || 6;
    const { regOpenAt } = calculateRegDates(tournament.startDate, daysBeforeStart);

    // Use template defaults or £10 default for entry fee
    const entryFeePennies = compType.default_entry_fee_pennies || 1000; // £10 default
    const entrantsCap = compType.default_entrants_cap || 1000;
    const adminFeePercent = compType.default_admin_fee_percent || 10;

    competitions.push({
      name: compType.name,
      type: compType.slug,
      typeId: compType.id,
      entryFee: entryFeePennies / 100, // Convert pennies to pounds for display
      entrantsCap,
      adminFeePercent,
      regOpenAt,
      regCloseAt: regCloseAt.toISOString(),
    });
  }

  console.log(`✅ Generated ${competitions.length} competitions`);
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
    
    // Generate competitions from database
    const competitions = await generateCompetitions(tournament);
    
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
