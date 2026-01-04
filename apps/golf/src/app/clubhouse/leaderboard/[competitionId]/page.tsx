'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import styles from './leaderboard.module.css';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  golfer_ids: string[];
  captain_id: string;
  credits_paid: number;
  user: {
    display_name: string;
    username: string;
  };
  golfer_details?: Array<{ name: string; score: number }>;
  total_score?: number;
  position?: number;
}

interface Competition {
  id: string;
  name: string;
  description: string;
  entry_credits: number;
  prize_credits: number;
  rounds_covered?: number[];
  event: {
    name: string;
    status: string;
    slug: string;
  };
}

export default function LeaderboardPage() {
  const params = useParams();
  const competitionId = params.competitionId as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>(competitionId);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedRound]);

  async function fetchLeaderboard() {
    const supabase = createClient();
    
    // Fetch competition details for selected round
    const { data: compData, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select('*')
      .eq('id', selectedRound)
      .single();

    if (compError) {
      console.error('Error fetching competition:', compError);
      setLoading(false);
      return;
    }

    // Fetch all competitions for this event (for round selector)
    const { data: allCompsData } = await supabase
      .from('clubhouse_competitions')
      .select('id, name, rounds_covered')
      .eq('event_id', compData.event_id)
      .order('rounds_covered');

    console.log('Fetched competitions:', allCompsData?.length || 0, 'comps for event', compData.event_id);
    if (allCompsData) {
      const compsWithEvent = allCompsData.map(c => ({
        ...c,
        event: { name: '', status: '', slug: '' }
      }));
      setAllCompetitions(compsWithEvent as Competition[]);
      console.log('Set allCompetitions:', compsWithEvent.length);
    }

    // Fetch event details
    const { data: eventData } = await supabase
      .from('clubhouse_events')
      .select('name, status, slug')
      .eq('id', compData.event_id)
      .single();

    setCompetition({
      ...compData,
      event: eventData || { name: 'Unknown Event', status: 'unknown', slug: '' }
    });

    // Fetch entries
    const { data: entriesData, error: entriesError } = await supabase
      .from('clubhouse_entries')
      .select('*')
      .eq('competition_id', selectedRound)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    console.log('Entries data:', entriesData?.length || 0, 'entries for competition', selectedRound);

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
      setLoading(false);
      return;
    }

    if (!entriesData || entriesData.length === 0) {
      console.log('No entries found');
      setEntries([]);
      setLoading(false);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set(entriesData?.map(e => e.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .in('id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Fetch all golfers for entries
    const allGolferIds = [...new Set(entriesData?.flatMap(e => e.golfer_ids) || [])];
    console.log('Fetching golfers:', allGolferIds.length);
    
    const { data: golfers } = await supabase
      .from('golfers')
      .select('id, first_name, last_name')
      .in('id', allGolferIds);

    console.log('Fetched golfers:', golfers?.length || 0);

    const golferMap = new Map(golfers?.map(g => [g.id, {
      name: `${g.first_name[0]}. ${g.last_name}`,
      score: Math.floor(Math.random() * 10) - 5 // Mock individual golfer score
    }]) || []);

    // Enrich entries with user data, golfer details, and mock scores
    const withScores = (entriesData || []).map((entry, idx) => {
      const profile = profileMap.get(entry.user_id);
      const golferDetails = entry.golfer_ids.map((id: string) => golferMap.get(id) || { name: 'Unknown', score: 0 }).slice(0, 6);
      return {
        ...entry,
        user: profile || { display_name: 'Unknown', username: 'unknown' },
        golfer_details: golferDetails,
        total_score: Math.floor(Math.random() * 20) - 10, // Mock score
        position: idx + 1
      };
    }).sort((a, b) => (a.total_score || 0) - (b.total_score || 0));
const getRoundLabel = (comp: Competition) => {
    if (!comp.rounds_covered || comp.rounds_covered.length === 0) return 'All Rounds';
    if (comp.rounds_covered.length === 4) return 'All Rounds';
    if (comp.rounds_covered.length === 1) return `R${comp.rounds_covered[0]}`;
    return `R${comp.rounds_covered.join(', ')}`;
  };

  
    setEntries(withScores);
    setLoading(false);
  }

  const getPositionBadge = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      upcoming: '#6b7280',
      open: '#10b981',
      active: '#f59e0b',
      completed: '#6366f1'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const getRoundLabel = (comp: Competition) => {
    if (!comp.rounds_covered || comp.rounds_covered.length === 0) return 'All Rounds';
    if (comp.rounds_covered.length === 4) return 'All Rounds';
    if (comp.rounds_covered.length === 1) return `R${comp.rounds_covered[0]}`;
    return `R${comp.rounds_covered.join(', ')}`;
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!competition) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-circle"></i>
            <h3>Competition Not Found</h3>
            <p>The competition you're looking for doesn't exist.</p>
            <Link href="/clubhouse/events" className={styles.backLink}>
              <i className="fas fa-arrow-left"></i>
              Back to Events
            </Link>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.topRow}>
            <Link href={`/clubhouse/events/${competition.event.slug}`} className={styles.backLink}>
              <i className="fas fa-arrow-left"></i>
              Back to Event
            </Link>
            
            <h1 className={styles.title}>
              <i className="fas fa-trophy"></i>
              {competition.event.name}
            </h1>

            <div className={styles.spacer}></div>
          </div>

          {/* Round Selector Inline */}
          {allCompetitions.length > 1 && (
            <div className={styles.roundTabsInline}>
              <span className={styles.competitionName}>{competition.name}</span>
              <div className={styles.roundButtons}>
                {allCompetitions.map((comp) => (
                  <button
                    key={comp.id}
                    className={`${styles.roundTab} ${selectedRound === comp.id ? styles.active : ''}`}
                    onClick={() => setSelectedRound(comp.id)}
                  >
                    {getRoundLabel(comp)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Competition Stats Inline */}
          <div className={styles.headerStats}>
            <span className={styles.statItem}>
              <i className="fas fa-users"></i> {entries.length} Entries
            </span>
            <span className={styles.statItem}>
              <i className="fas fa-coins"></i> {competition.entry_credits} Entry Credits
            </span>
            <span className={styles.statItem}>
              <i className="fas fa-trophy"></i> {competition.prize_credits || 'TBD'} Prize Pool
            </span>
          </div>
        </div>

        {/* Leaderboard */}
        {entries.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-users"></i>
            <h3>No Entries Yet</h3>
            <p>Be the first to enter this competition!</p>
            <Link 
              href={`/clubhouse/build-team/${competition.id}`}
              className={styles.enterBtn}
            >
              Enter Now
            </Link>
          </div>
        ) : (
          <div className={styles.leaderboard}>
            <div className={styles.leaderboardHeader}>
              <div className={styles.headerCell} style={{ flex: '0 0 60px' }}>Pos</div>
              <div className={styles.headerCell} style={{ flex: '1' }}>Player</div>
              <div className={styles.headerCell} style={{ flex: '0 0 100px', textAlign: 'right' }}>Score</div>
            </div>

            {entries.map((entry, idx) => (
              <div 
                key={entry.id} 
                className={`${styles.leaderboardRow} ${idx < 3 ? styles.topThree : ''}`}
              >
                <div className={styles.position}>
                  {getPositionBadge(entry.position || idx + 1)}
                </div>
                <div className={styles.playerInfo}>
                  <div className={styles.playerNameRow}>
                    <span className={styles.playerName}>
                      {entry.user?.display_name || entry.user?.username || 'Unknown Player'}
                    </span>
                    <div className={styles.golferNames}>
                      {entry.golfer_details?.map((golfer, i) => (
                        <span key={i} className={styles.golferBadge}>
                          <span className={styles.golferName}>{golfer.name}</span>
                          <span className={styles.golferScore}>
                            {golfer.score > 0 ? '+' : ''}{golfer.score}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className={styles.score}>
                  <span className={entry.total_score && entry.total_score < 0 ? styles.under : styles.over}>
                    {entry.total_score ? (entry.total_score > 0 ? '+' : '') + entry.total_score : 'E'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live Updates Notice */}
        {competition.event.status === 'active' && (
          <div className={styles.liveNotice}>
            <i className="fas fa-circle-dot"></i>
            Live scoring updates every 5 minutes
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
