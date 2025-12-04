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
    // First, let's see ALL competitions to debug
    const { data: allComps } = await supabase
      .from('tournament_competitions')
      .select('id, status, competition_type_id, entry_fee_pennies')
      .eq('tournament_id', tournament.id);
    
    console.log(`🔍 All competitions for ${tournament.name}:`, allComps);

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
      .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live'])
      .order('entry_fee_pennies', { ascending: false });

    console.log(`✅ Filtered competitions (${competitions?.length || 0}):`, competitions?.map(c => ({ 
      name: c.competition_types?.name, 
      status: c.status,
      type_id: c.competition_type_id,
      fee: c.entry_fee_pennies,
      entrants_cap: c.entrants_cap,
      guaranteed_prize: c.guaranteed_prize_pool_pennies,
      first_place_prize: c.first_place_prize_pennies,
      admin_fee: c.admin_fee_percent,
      reg_open_at: c.reg_open_at,
      reg_close_at: c.reg_close_at
    })));

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
