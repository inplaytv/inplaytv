import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') || 'upcoming,live,registration_open,registration_closed';

    console.log('🔍 Tournaments API - Requested status:', statusParam);

    // Handle multiple statuses separated by comma
    // NOTE: Status values match auto_update_tournament_statuses() function:
    // 'upcoming' → Before registration opens
    // 'registration_open' → Registration is open (was 'reg_open')
    // 'registration_closed' → Registration closed, waiting for tournament start
    // 'live' → Tournament is currently being played
    const statuses = statusParam.split(',').map(s => s.trim());

    // Fetch tournaments with their competitions
    // Only show tournaments that are marked as visible and have upcoming or live status
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(`
        id,
        name,
        slug,
        description,
        location,
        start_date,
        end_date,
        status,
        image_url,
        created_at
      `)
      .in('status', statuses)
      .eq('is_visible', true)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each tournament, fetch its competitions
    const tournamentsWithCompetitions = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        const { data: competitions, error: compError } = await supabase
          .from('tournament_competitions')
          .select(`
            id,
            entry_fee_pennies,
            entrants_cap,
            admin_fee_percent,
            reg_open_at,
            reg_close_at,
            start_at,
            end_at,
            status,
            tournament_id,
            competition_type_id,
            competition_types (
              id,
              name,
              slug,
              description
            )
          `)
          .eq('tournament_id', tournament.id)
          .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
          .order('entry_fee_pennies', { ascending: false });

        return {
          ...tournament,
          competitions: competitions || [],
        };
      })
    );

    return NextResponse.json(tournamentsWithCompetitions);
  } catch (error: any) {
    console.error('GET tournaments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
