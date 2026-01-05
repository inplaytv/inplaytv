import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/one-2-one/my-matches
 * Get all ONE 2 ONE matches for the current user
 * Query params: status (optional) - 'waiting', 'live', 'completed', 'cancelled'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authSupabase = await createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status');

    // Get all user's ONE 2 ONE entries
    let query = supabase
      .from('competition_entries')
      .select(`
        id,
        entry_name,
        total_salary,
        status,
        created_at,
        competition:competition_id (
          id,
          instance_number,
          current_players,
          max_players,
          status,
          reg_close_at,
          winner_entry_id,
          competition_format,
          template:template_id (
            name,
            short_name,
            rounds_covered,
            entry_fee_pennies
          ),
          tournament:tournament_id (
            id,
            name,
            slug,
            start_date,
            status
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('competition.competition_format', 'one2one')
      .order('created_at', { ascending: false });

    const { data: entries, error: entriesError } = await query;

    if (entriesError) {
      console.error('Error fetching user matches:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch matches' },
        { status: 500 }
      );
    }

    if (!entries) {
      return NextResponse.json({ matches: [] });
    }

    // For each match, get opponent info
    const matchesWithOpponents = await Promise.all(
      entries.map(async (entry) => {
        // Handle nested competition data - it comes as an array
        const competition = Array.isArray(entry.competition) ? entry.competition[0] : entry.competition;
        if (!competition) {
          return {
            ...entry,
            competition,
            opponent: null,
            match_status: 'unknown' as string,
            user_won: false
          };
        }

        // Get other player in this competition
        const { data: opponentEntry } = await supabase
          .from('competition_entries')
          .select(`
            id,
            entry_name,
            profiles:user_id (username)
          `)
          .eq('competition_id', competition.id)
          .neq('user_id', user.id)
          .in('status', ['submitted', 'paid'])
          .maybeSingle();

        // Determine match status for UI
        let matchStatus = 'waiting';
        if (competition.status === 'cancelled') {
          matchStatus = 'cancelled';
        } else if (competition.status === 'completed') {
          matchStatus = 'completed';
        } else if (competition.status === 'full' || competition.current_players === 2) {
          matchStatus = 'live';
        }

        // Check if user won
        const userWon = competition.winner_entry_id === entry.id;

        return {
          ...entry,
          competition,
          opponent: opponentEntry,
          match_status: matchStatus as string,
          user_won: userWon as boolean
        };
      })
    );

    // Apply status filter if provided
    let filteredMatches = matchesWithOpponents;
    if (statusFilter) {
      filteredMatches = matchesWithOpponents.filter(
        m => m.match_status === statusFilter
      );
    }

    return NextResponse.json({
      matches: filteredMatches,
      total: filteredMatches.length
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/one-2-one/my-matches:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
