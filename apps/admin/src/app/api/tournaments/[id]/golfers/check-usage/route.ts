import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const golferId = searchParams.get('golfer_id');

    if (!golferId) {
      return NextResponse.json({ error: 'golfer_id is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if this golfer is used in any entry_picks for this tournament
    // First, get all competition IDs for this tournament
    const { data: competitions } = await adminClient
      .from('competitions')
      .select('id')
      .eq('tournament_id', params.id);

    if (!competitions || competitions.length === 0) {
      return NextResponse.json({ hasEntries: false, entryCount: 0 });
    }

    const competitionIds = competitions.map(c => c.id);

    // Check for entries with this golfer
    const { data: entries } = await adminClient
      .from('competition_entries')
      .select('id')
      .in('competition_id', competitionIds);

    if (!entries || entries.length === 0) {
      return NextResponse.json({ hasEntries: false, entryCount: 0 });
    }

    const entryIds = entries.map(e => e.id);

    // Check if golfer is picked in any of these entries
    const { data: picks, error } = await adminClient
      .from('entry_picks')
      .select('entry_id')
      .eq('golfer_id', golferId)
      .in('entry_id', entryIds);

    if (error) {
      console.error('Error checking golfer usage:', error);
      return NextResponse.json({ hasEntries: false, entryCount: 0 });
    }

    const hasEntries = picks && picks.length > 0;
    const uniqueEntries = hasEntries ? new Set(picks.map(p => p.entry_id)).size : 0;

    return NextResponse.json({
      hasEntries,
      entryCount: uniqueEntries,
      pickCount: picks?.length || 0
    });
  } catch (error: any) {
    console.error('Error checking golfer usage:', error);
    return NextResponse.json(
      { error: 'Failed to check golfer usage', hasEntries: false, entryCount: 0 },
      { status: 500 }
    );
  }
}
