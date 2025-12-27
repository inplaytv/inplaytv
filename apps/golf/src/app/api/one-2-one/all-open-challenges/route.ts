import { createServerClient } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Fetch ALL open ONE 2 ONE competitions (waiting for opponent) from ALL tournaments
    const { data: competitions, error } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        instance_number,
        current_players,
        max_players,
        status,
        entry_fee_pennies,
        created_at,
        tournament_id,
        template_id,
        competition_format,
        tournaments!tournament_competitions_tournament_id_fkey (
          id,
          name,
          slug,
          end_date,
          status
        ),
        competition_templates (
          name,
          short_name,
          rounds_covered,
          admin_fee_percent
        )
      `)
      .eq('competition_format', 'one2one')
      .in('status', ['pending', 'open'])  // ONLY show pending/open, exclude 'full'
      .lt('current_players', 2)  // Double-check: only show challenges with less than 2 players
      .order('created_at', { ascending: false })
      .limit(100);  // Fetch more, we'll filter client-side

    if (error) {
      console.error('❌ Error fetching all open challenges:', error);
      throw error;
    }
    
    console.log(`🔍 Found ${competitions?.length || 0} open ONE 2 ONE challenges (status: pending or open, current_players < 2)`);

    // CRITICAL: Filter out challenges from tournaments that have ended
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeCompetitions = (competitions || []).filter((comp: any) => {
      if (!comp.tournaments?.end_date) return false;
      const tournamentEnd = new Date(comp.tournaments.end_date);
      tournamentEnd.setHours(23, 59, 59, 999); // End of tournament day
      return today <= tournamentEnd; // Only include tournaments that haven't ended yet
    })
    .slice(0, 50);  // Limit to 50 after filtering

    // Get the FIRST entry (creator) for each competition
    const competitionIds = activeCompetitions.map(comp => comp.id);
    
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, user_id, entry_name, competition_id, created_at')
      .in('competition_id', competitionIds)
      .not('user_id', 'is', null)
      .order('created_at', { ascending: true });

    // Group entries by competition_id and take the first (creator)
    const creatorEntryMap = new Map();
    entries?.forEach(entry => {
      if (!creatorEntryMap.has(entry.competition_id)) {
        creatorEntryMap.set(entry.competition_id, entry);
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

    // Transform data for frontend (using filtered activeCompetitions)
    const challenges = activeCompetitions
      .filter(comp => creatorEntryMap.has(comp.id))  // Only show competitions with at least 1 entry
      .map((comp: any) => {
      const entry = creatorEntryMap.get(comp.id);
      const profile = profileMap.get(entry?.user_id);
      
      return {
        instanceId: comp.id,  // Keep as instanceId for frontend compatibility
        instanceNumber: comp.instance_number,
        tournamentId: comp.tournament_id,
        tournamentName: comp.tournaments?.name || 'Unknown Tournament',
        tournamentSlug: comp.tournaments?.slug || '',
        templateName: comp.competition_templates?.name || 'ONE 2 ONE',
        shortName: comp.competition_templates?.short_name || '1v1',
        roundsCovered: comp.competition_templates?.rounds_covered || [],
        entryFeePennies: comp.entry_fee_pennies,
        adminFeePercent: comp.competition_templates?.admin_fee_percent || 10,
        currentPlayers: comp.current_players,
        maxPlayers: comp.max_players,
        createdAt: comp.created_at,
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
