import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabaseServer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/one-2-one/instances/[instanceId]
 * Get details of a specific ONE 2 ONE competition with entries
 * Note: URL still uses 'instanceId' for backwards compatibility, but queries tournament_competitions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  try {
    const supabase = await createServerClient();
    const { instanceId } = await params;

    // Get competition with template and tournament info
    const { data: competition, error: competitionError } = await supabase
      .from('tournament_competitions')
      .select(`
        *,
        template:competition_templates (*),
        tournament:tournaments (id, name, slug, start_date, status)
      `)
      .eq('id', instanceId)
      .eq('competition_format', 'one2one')
      .single();

    if (competitionError || !competition) {
      return NextResponse.json(
        { error: 'Competition not found' },
        { status: 404 }
      );
    }

    // Get entries for this competition
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select(`
        id,
        user_id,
        entry_name,
        total_salary,
        status,
        created_at,
        profiles:user_id (username)
      `)
      .eq('competition_id', instanceId)
      .in('status', ['submitted', 'paid']);

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      return NextResponse.json(
        { error: 'Failed to fetch entries' },
        { status: 500 }
      );
    }

    // Get current user to check if they're in this match
    const authSupabase = await createServerClient();
    const { data: { user } } = await authSupabase.auth.getUser();
    const userInMatch = user ? entries?.some(e => e.user_id === user.id) : false;

    return NextResponse.json({
      instance: competition, // Keep 'instance' key for frontend compatibility
      entries: entries || [],
      user_in_match: userInMatch,
      spots_remaining: competition.max_players - competition.current_players
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/one-2-one/instances:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
