import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch tournament by slug
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('slug', slug)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Fetch competitions for this tournament
    const { data: competitions, error: competitionsError } = await supabase
      .from('tournament_competitions')
      .select(`
        *,
        competition_types!inner (
          id,
          name,
          slug,
          rounds_count
        )
      `)
      .eq('tournament_id', tournament.id)
      .eq('competition_format', 'inplay')
      .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
      .order('entry_fee_pennies', { ascending: false });

    if (competitionsError) {
      console.error('Error fetching competitions:', competitionsError);
      return NextResponse.json(
        { error: 'Failed to fetch competitions' },
        { status: 500 }
      );
    }

    const tournamentWithCompetitions = {
      ...tournament,
      competitions: competitions || [],
    };

    return NextResponse.json(tournamentWithCompetitions, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('GET tournament error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
