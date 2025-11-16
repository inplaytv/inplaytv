import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active tournaments with their featured competition
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
        created_at,
        featured_competition_id
      `)
      .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
      .gte('end_date', new Date().toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // For each tournament, fetch its competitions and featured competition details
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

        if (compError) {
          console.error(`Competition fetch error for tournament ${tournament.name}:`, compError);
        }

        console.log(`Tournament: ${tournament.name} (${tournament.status})`);
        console.log(`  Competitions found: ${competitions?.length || 0}`);
        if (competitions && competitions.length > 0) {
          competitions.forEach(c => {
            console.log(`  - ${c.competition_types?.name}: status=${c.status}, fee=${c.entry_fee_pennies}p`);
          });
        }

        // Find the featured competition if one is set
        const featuredCompetition = tournament.featured_competition_id
          ? (competitions || []).find(c => c.id === tournament.featured_competition_id)
          : null;

        return {
          ...tournament,
          competitions: competitions || [],
          featured_competition: featuredCompetition,
        };
      })
    );

    return NextResponse.json({
      tournaments: tournamentsWithCompetitions,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GET tournaments error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
