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

    // Fetch competition details
    const { data: competition, error: compError } = await supabase
      .from('tournament_competitions')
      .select('entrants_cap, entry_fee_pennies, admin_fee_percent')
      .eq('id', competitionId)
      .single();

    if (compError) {
      return NextResponse.json({ error: 'Failed to fetch competition' }, { status: 500 });
    }

    // Calculate first prize (20% of pool - will use DB value once migration is run)
    const totalPool = (competition?.entry_fee_pennies || 0) * (competition?.entrants_cap || 0);
    const adminFee = totalPool * ((competition?.admin_fee_percent || 0) / 100);
    const prizePool = totalPool - adminFee;
    const firstPrize = Math.floor(prizePool * 0.20); // 20% for 1st place

    // Fetch all entries for this competition
    const { data: entries, error: entriesError } = await supabase
      .from('competition_entries')
      .select('id, user_id, entry_name, total_salary, created_at')
      .eq('competition_id', competitionId)
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
