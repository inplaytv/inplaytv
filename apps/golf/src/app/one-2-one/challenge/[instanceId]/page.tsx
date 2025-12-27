import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabaseServer';
import ChallengeView from './ChallengeView';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    instanceId: string;
  }>;
}

async function getChallengeData(instanceId: string) {
  const supabase = await createServerClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  // Get competition from unified table
  const { data: competition, error: competitionError } = await supabase
    .from('tournament_competitions')
    .select('*')
    .eq('id', instanceId)
    .eq('competition_format', 'one2one')
    .single();

  if (competitionError || !competition) {
    console.error('Failed to fetch challenge competition:', { instanceId, error: competitionError });
    return null;
  }

  // Get tournament details
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date')
    .eq('id', competition.tournament_id)
    .single();

  if (!tournament) {
    console.error('Failed to fetch tournament:', { 
      tournamentId: competition.tournament_id, 
      error: tournamentError 
    });
    return null;
  }

  // Get all entries for this challenge
  const { data: entries } = await supabase
    .from('competition_entries')
    .select('*')
    .eq('competition_id', instanceId)
    .order('created_at', { ascending: true });

  if (!entries || entries.length < 1) {
    return null;
  }

  // For now, allow showing even if not full (1 or 2 players)
  if (entries.length > 2) {
    console.error('Challenge has too many entries:', { 
      instanceId, 
      entriesFound: entries.length
    });
    return null;
  }

  // Get profiles for both users
  const userIds = entries.map(e => e.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds);

  // Get golfers for both entries (captain golfers)
  const golferIds = entries.map(e => e.captain_golfer_id).filter(Boolean);
  const { data: golfers } = await supabase
    .from('golfers')
    .select('id, name, country')
    .in('id', golferIds);
    
  // Get current scores for both captain golfers from tournament_golfers
  const { data: scores } = await supabase
    .from('tournament_golfers')
    .select('golfer_id, total_score, status, position, to_par, r1_score, r2_score, r3_score, r4_score, r1_holes, r2_holes, r3_holes, r4_holes')
    .eq('tournament_id', tournament.id)
    .in('golfer_id', golferIds);

  // Get team picks for both entries (6 golfers each)
  const { data: picks } = await supabase
    .from('entry_picks')
    .select(`
      *,
      golfers:golfer_id (
        id,
        name,
        country
      )
    `)
    .in('entry_id', entries.map(e => e.id))
    .order('slot_position', { ascending: true });

  // Get scores for all picked golfers (including round scores and hole-by-hole data)
  const allPickedGolferIds = picks?.map(p => p.golfer_id).filter(Boolean) || [];
  const { data: allPickScores } = await supabase
    .from('tournament_golfers')
    .select('golfer_id, total_score, status, position, to_par, r1_score, r2_score, r3_score, r4_score, r1_holes, r2_holes, r3_holes, r4_holes')
    .eq('tournament_id', tournament.id)
    .in('golfer_id', allPickedGolferIds);

  // Map data together
  const enrichedEntries = entries.map(entry => {
    const profile = profiles?.find(p => p.id === entry.user_id);
    const golfer = golfers?.find(g => g.id === entry.captain_golfer_id);
    const score = scores?.find(s => s.golfer_id === entry.captain_golfer_id) || {
      total_score: null,
      thru: null,
      status: null,
      position: null
    };

    // Get picks for this entry (6 golfers per user)
    const entryPicks = picks?.filter(p => p.entry_id === entry.id) || [];
    const enrichedPicks = entryPicks.map(pick => {
      const pickScore = allPickScores?.find(s => s.golfer_id === pick.golfer_id) || {
        total_score: null,
        status: null,
        position: null,
        to_par: null,
        r1_score: null,
        r2_score: null,
        r3_score: null,
        r4_score: null,
        r1_holes: null,
        r2_holes: null,
        r3_holes: null,
        r4_holes: null
      };
      // Map database column names to UI-friendly names
      const scoreWithRounds = {
        ...pickScore,
        r1: pickScore.r1_score,
        r2: pickScore.r2_score,
        r3: pickScore.r3_score,
        r4: pickScore.r4_score,
        r1_holes: pickScore.r1_holes,
        r2_holes: pickScore.r2_holes,
        r3_holes: pickScore.r3_holes,
        r4_holes: pickScore.r4_holes
      };
      // Determine if this golfer is the captain (using captain_golfer_id field)
      const isCaptain = pick.golfer_id === entry.captain_golfer_id;
      return {
        ...pick,
        score: scoreWithRounds,
        is_captain: isCaptain
      };
    });

    return {
      ...entry,
      profiles: profile,
      golfers: golfer,
      score,
      picks: enrichedPicks
    };
  });

  return {
    competition,
    entries: enrichedEntries,
    currentUserId: user.id,
    tournament
  };
}

export default async function ChallengePage({ params }: PageProps) {
  const { instanceId } = await params;
  const data = await getChallengeData(instanceId);

  if (!data) {
    notFound();
  }

  return <ChallengeView data={data} />;
}
