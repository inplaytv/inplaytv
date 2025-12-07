import { createServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const supabase = await createServerClient();

    // Fetch open instances (waiting for opponent) for this tournament
    const { data: instances, error } = await supabase
      .from('competition_instances')
      .select(`
        id,
        instance_number,
        current_players,
        max_players,
        entry_fee_pennies,
        created_at,
        competition_templates!inner (
          name,
          short_name,
          rounds_covered,
          admin_fee_percent
        ),
        competition_entries!competition_entries_instance_id_fkey!inner (
          id,
          user_id,
          entry_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .eq('status', 'open')
      .lt('current_players', 2)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching open challenges:', error);
      throw error;
    }

    // Get unique user IDs to fetch profiles
    const userIds = [...new Set((instances || [])
      .map((inst: any) => {
        const entry = Array.isArray(inst.competition_entries) ? inst.competition_entries[0] : inst.competition_entries;
        return entry?.user_id;
      })
      .filter(Boolean))];

    // Fetch profiles for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Transform data for frontend
    const challenges = (instances || []).map((inst: any) => {
      const entry = Array.isArray(inst.competition_entries) ? inst.competition_entries[0] : inst.competition_entries;
      const profile = profileMap.get(entry?.user_id);
      
      return {
        instanceId: inst.id,
        instanceNumber: inst.instance_number,
        templateName: inst.competition_templates?.name || 'ONE 2 ONE',
        shortName: inst.competition_templates?.short_name || '1v1',
        roundsCovered: inst.competition_templates?.rounds_covered || [],
        entryFeePennies: inst.entry_fee_pennies,
        adminFeePercent: inst.competition_templates?.admin_fee_percent || 10,
        currentPlayers: inst.current_players,
        maxPlayers: inst.max_players,
        createdAt: inst.created_at,
        challenger: {
          userId: entry?.user_id,
          displayName: profile?.display_name || profile?.username || entry?.entry_name || 'Anonymous',
          entryName: entry?.entry_name
        }
      };
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('Open challenges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch open challenges' },
      { status: 500 }
    );
  }
}
