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
  console.log('🔍 Fetching challenge data for instanceId:', instanceId);
  const supabase = await createServerClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user');
    return null;
  }
  console.log('✅ User authenticated:', user.id);

  // Get competition instance
  const { data: instance, error: instanceError } = await supabase
    .from('competition_instances')
    .select('*')
    .eq('id', instanceId)
    .single();

  if (instanceError || !instance) {
    console.error('Failed to fetch challenge instance:', { instanceId, error: instanceError });
    return null;
  }

  console.log('✅ Instance found:', { instance, tournamentId: instance.tournament_id });

  // Get tournament details directly (no competition table)
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date')
    .eq('id', instance.tournament_id)
    .single();

  if (!tournament) {
    console.error('Failed to fetch tournament:', { 
      tournamentId: instance.tournament_id, 
      error: tournamentError 
    });
    return null;
  }

  // Get all entries for this challenge
  const { data: entries } = await supabase
    .from('competition_entries')
    .select('*')
    .eq('instance_id', instanceId)
    .order('created_at', { ascending: true });

  console.log('📝 Entries found:', { 
    instanceId, 
    entriesFound: entries?.length,
    entries: entries?.map(e => ({ id: e.id, userId: e.user_id, createdAt: e.created_at }))
  });

  if (!entries || entries.length < 1) {
    console.error('Challenge entries check failed - no entries found:', { 
      instanceId, 
      entriesFound: entries?.length,
      entries 
    });
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

  // Get golfers for both entries
  const golferIds = entries.map(e => e.golfer_id);
  const { data: golfers } = await supabase
    .from('golfers')
    .select('id, name, country')
    .in('id', golferIds);
    
  // Get current scores for both golfers from tournament_golfer_scores
  const { data: scores } = await supabase
    .from('tournament_golfer_scores')
    .select('golfer_id, total_score, thru, status, position')
    .eq('tournament_id', tournament.id)
    .in('golfer_id', golferIds);

  // Map data together
  const enrichedEntries = entries.map(entry => {
    const profile = profiles?.find(p => p.id === entry.user_id);
    const golfer = golfers?.find(g => g.id === entry.golfer_id);
    const score = scores?.find(s => s.golfer_id === entry.golfer_id) || {
      total_score: null,
      thru: null,
      status: null,
      position: null
    };

    return {
      ...entry,
      profiles: profile,
      golfers: golfer,
      score
    };
  });

  return {
    instance,
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
