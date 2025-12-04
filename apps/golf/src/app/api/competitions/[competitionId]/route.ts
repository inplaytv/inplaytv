import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch competition details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get competition details with tournament info
    const { data, error } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        tournament_id,
        entry_fee_pennies,
        entrants_cap,
        reg_open_at,
        reg_close_at,
        start_at,
        end_at,
        competition_types (
          name
        ),
        tournaments!tournament_competitions_tournament_id_fkey (
          name,
          start_date,
          end_date,
          location
        )
      `)
      .eq('id', competitionId)
      .single();

    if (error) {
      console.error('Error fetching competition:', error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Flatten the response
    const compType: any = data.competition_types;
    const tournament: any = data.tournaments;
    
    const competition = {
      id: data.id,
      tournament_id: data.tournament_id,
      competition_type_name: compType?.name || 'Competition',
      tournament_name: tournament?.name || 'Tournament',
      tournament_start_date: tournament?.start_date,
      tournament_end_date: tournament?.end_date,
      tournament_location: tournament?.location,
      entry_fee_pennies: data.entry_fee_pennies,
      entrants_cap: data.entrants_cap,
      reg_open_at: data.reg_open_at,
      reg_close_at: data.reg_close_at,
      start_at: data.start_at,
      end_at: data.end_at,
    };

    return NextResponse.json(competition);
  } catch (error: any) {
    console.error('GET competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competition' },
      { status: 500 }
    );
  }
}
