import { createServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Fetch ALL open instances (waiting for opponent) from ALL tournaments
    const { data: instances, error } = await supabase
      .from('competition_instances')
      .select(`
        id,
        instance_number,
        current_players,
        max_players,
        entry_fee_pennies,
        created_at,
        tournament_id,
        tournaments!inner (
          id,
          name,
          slug
        ),
        competition_templates!inner (
          name,
          short_name,
          rounds_covered,
          admin_fee_percent
        )
      `)
      .eq('status', 'open')
      .lt('current_players', 2)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching all open challenges:', error);
      throw error;
    }

    // Get the FIRST entry (creator) for each instance
    const instanceIds = (instances || []).map(inst => inst.id);
    
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, user_id, entry_name, instance_id, created_at')
      .in('instance_id', instanceIds)
      .not('user_id', 'is', null)  // Exclude entries with NULL user_id
      .order('created_at', { ascending: true });

    console.log('📝 All entries fetched:', entries?.length, entries?.map(e => ({ 
      instanceId: e.instance_id, 
      userId: e.user_id, 
      createdAt: e.created_at 
    })));

    // Group entries by instance_id and take the first (creator)
    const creatorEntryMap = new Map();
    entries?.forEach(entry => {
      if (!creatorEntryMap.has(entry.instance_id)) {
        creatorEntryMap.set(entry.instance_id, entry);
      }
    });

    // Get unique user IDs to fetch profiles
    const userIds = [...new Set(Array.from(creatorEntryMap.values()).map((entry: any) => entry.user_id).filter(Boolean))];

    // Fetch profiles for all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Transform data for frontend
    const challenges = (instances || []).map((inst: any) => {
      const entry = creatorEntryMap.get(inst.id);
      const profile = profileMap.get(entry?.user_id);
      
      return {
        instanceId: inst.id,
        instanceNumber: inst.instance_number,
        tournamentId: inst.tournament_id,
        tournamentName: inst.tournaments?.name || 'Unknown Tournament',
        tournamentSlug: inst.tournaments?.slug || '',
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
      }
    });

    return NextResponse.json({ challenges });
  } catch (error) {
    console.error('All open challenges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch all open challenges' },
      { status: 500 }
    );
  }
}
