import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET - Fetch competition details (supports both tournament_competitions AND competition_instances)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const { competitionId } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try tournament_competitions first (regular competitions)
    const { data: compData, error: compError } = await supabase
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
      .maybeSingle();

    if (compData) {
      // Regular competition found
      const compType: any = compData.competition_types;
      const tournament: any = compData.tournaments;
      
      const competition = {
        id: compData.id,
        tournament_id: compData.tournament_id,
        competition_type_name: compType?.name || 'Competition',
        tournament_name: tournament?.name || 'Tournament',
        tournament_start_date: tournament?.start_date,
        tournament_end_date: tournament?.end_date,
        tournament_location: tournament?.location,
        entry_fee_pennies: compData.entry_fee_pennies,
        entrants_cap: compData.entrants_cap,
        reg_open_at: compData.reg_open_at,
        reg_close_at: compData.reg_close_at,
        start_at: compData.start_at,
        end_at: compData.end_at,
      };

      return NextResponse.json(competition);
    }

    // Try competition_instances (ONE 2 ONE competitions)
    const { data: instanceData, error: instanceError } = await supabase
      .from('competition_instances')
      .select(`
        id,
        tournament_id,
        current_players,
        max_players,
        status,
        entry_fee_pennies,
        reg_close_at,
        start_at,
        end_at,
        competition_templates!competition_instances_template_id_fkey (
          name,
          entry_fee_pennies
        ),
        tournaments!competition_instances_tournament_id_fkey (
          name,
          start_date,
          end_date,
          location
        )
      `)
      .eq('id', competitionId)
      .maybeSingle();

    if (instanceData) {
      // ONE 2 ONE instance found
      const template: any = instanceData.competition_templates;
      const tournament: any = instanceData.tournaments;
      
      const competition = {
        id: instanceData.id,
        tournament_id: instanceData.tournament_id,
        competition_type_name: template?.name || 'ONE 2 ONE',
        tournament_name: tournament?.name || 'Tournament',
        tournament_start_date: tournament?.start_date,
        tournament_end_date: tournament?.end_date,
        tournament_location: tournament?.location,
        entry_fee_pennies: instanceData.entry_fee_pennies || template?.entry_fee_pennies || 0,
        entrants_cap: instanceData.max_players, // Always 2 for ONE 2 ONE
        reg_open_at: null, // ONE 2 ONE doesn't have open times, uses template
        reg_close_at: instanceData.reg_close_at,
        start_at: instanceData.start_at,
        end_at: instanceData.end_at,
        // ONE 2 ONE specific fields
        is_one_2_one: true,
        current_players: instanceData.current_players,
        instance_status: instanceData.status,
      };

      return NextResponse.json(competition);
    }

    // Neither found
    return NextResponse.json(
      { error: 'Competition not found' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('GET competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competition' },
      { status: 500 }
    );
  }
}
