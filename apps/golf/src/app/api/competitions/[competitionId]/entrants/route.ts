import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabaseServer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  try {
    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { competitionId } = await params;

    // Fetch competition details (supports both tournament_competitions AND competition_instances)
    let competition: any = null;
    
    const { data: compData } = await supabase
      .from('tournament_competitions')
      .select('entrants_cap, entry_fee_pennies, admin_fee_percent')
      .eq('id', competitionId)
      .maybeSingle();

    if (compData) {
      competition = compData;
    } else {
      // Try competition_instances (ONE 2 ONE)
      const { data: instanceData } = await supabase
        .from('competition_instances')
        .select(`
          max_players,
          entry_fee_pennies,
          competition_templates!competition_instances_template_id_fkey (
            entry_fee_pennies,
            admin_fee_percent
          )
        `)
        .eq('id', competitionId)
        .maybeSingle();
      
      if (instanceData) {
        const template: any = instanceData.competition_templates;
        competition = {
          entrants_cap: instanceData.max_players,
          entry_fee_pennies: instanceData.entry_fee_pennies || template?.entry_fee_pennies || 0,
          admin_fee_percent: template?.admin_fee_percent || 10
        };
      }
    }

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Calculate first prize (20% of pool - will use DB value once migration is run)
    const totalPool = (competition?.entry_fee_pennies || 0) * (competition?.entrants_cap || 0);
    const adminFee = totalPool * ((competition?.admin_fee_percent || 0) / 100);
    const prizePool = totalPool - adminFee;
    const firstPrize = Math.floor(prizePool * 0.20); // 20% for 1st place

    // Fetch all entries for this competition (check both competition_id and instance_id)
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select('id, user_id, entry_name, total_salary, created_at')
      .or(`competition_id.eq.${competitionId},instance_id.eq.${competitionId}`)
      .in('status', ['submitted', 'pending'])
      .order('created_at', { ascending: true });

    if (entriesError) {
      return NextResponse.json({ error: 'Failed to fetch entrants' }, { status: 500 });
    }

    return NextResponse.json({ 
      entrants: entries || [],
      maxEntries: competition?.entrants_cap || 0,
      firstPrize: firstPrize
    });
  } catch (error) {
    console.error('Error in competition entrants API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
