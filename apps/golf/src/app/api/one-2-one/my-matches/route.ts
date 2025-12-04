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
        instance:instance_id (
          id,
          instance_number,
          current_players,
          max_players,
          status,
          reg_close_at,
          winner_entry_id,
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
      .not('instance_id', 'is', null)
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
        // Handle nested instance data - it comes as an array
        const instance = Array.isArray(entry.instance) ? entry.instance[0] : entry.instance;
        if (!instance) {
          return {
            ...entry,
            instance,
            opponent: null,
            match_status: 'unknown' as string,
            user_won: false
          };
        }

        // Get other player in this instance
        const { data: opponentEntry } = await supabase
          .from('competition_entries')
          .select(`
            id,
            entry_name,
            profiles:user_id (username)
          `)
          .eq('instance_id', instance.id)
          .neq('user_id', user.id)
          .in('status', ['submitted', 'paid'])
          .maybeSingle();

        // Determine match status for UI
        let matchStatus = 'waiting';
        if (instance.status === 'cancelled') {
          matchStatus = 'cancelled';
        } else if (instance.status === 'completed') {
          matchStatus = 'completed';
        } else if (instance.status === 'full' || instance.current_players === 2) {
          matchStatus = 'live';
        }

        // Check if user won
        const userWon = instance.winner_entry_id === entry.id;

        return {
          ...entry,
          instance,
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
