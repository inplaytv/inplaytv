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
  total_score?: number;
  position?: number;
}

interface Competition {
  id: string;
  name: string;
  description: string;
  entry_credits: number;
  prize_credits: number;
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

  useEffect(() => {
    fetchLeaderboard();
  }, [competitionId]);

  async function fetchLeaderboard() {
    const supabase = createClient();
    
    // Fetch competition details
    const { data: compData, error: compError } = await supabase
      .from('clubhouse_competitions')
      .select(`
        *,
        event:clubhouse_events(name, status, slug)
      `)
      .eq('id', competitionId)
      .single();

    if (compError) {
      console.error('Error fetching competition:', compError);
      setLoading(false);
      return;
    }

    setCompetition(compData);

    // Fetch entries with user profiles
    const { data: entriesData, error: entriesError } = await supabase
      .from('clubhouse_entries')
      .select(`
        *,
        user:profiles(display_name, username)
      `)
      .eq('competition_id', competitionId)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
    } else {
      // Mock scoring - in real system would calculate from golfer scores
      const withScores = (entriesData || []).map((entry, idx) => ({
        ...entry,
        total_score: Math.floor(Math.random() * 20) - 10, // Mock score
        position: idx + 1
      })).sort((a, b) => (a.total_score || 0) - (b.total_score || 0));

      setEntries(withScores);
    }

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
            <Link href="/clubhouse/events" className={styles.backBtn}>
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
          <Link href={`/clubhouse/events/${competition.event.slug}`} className={styles.backLink}>
            <i className="fas fa-arrow-left"></i>
            Back to Event
          </Link>
          
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <i className="fas fa-trophy"></i>
              {competition.event.name}
            </h1>
            <p className={styles.subtitle}>{competition.name}</p>
          </div>

          <div className={styles.statusBadge} style={{ background: getStatusColor(competition.event.status) }}>
            {competition.event.status.toUpperCase()}
          </div>
        </div>

        {/* Competition Info */}
        <div className={styles.infoCard}>
          <div className={styles.infoStat}>
            <i className="fas fa-users"></i>
            <div>
              <span className={styles.statValue}>{entries.length}</span>
              <span className={styles.statLabel}>Entries</span>
            </div>
          </div>
          <div className={styles.infoStat}>
            <i className="fas fa-coins"></i>
            <div>
              <span className={styles.statValue}>{competition.entry_credits}</span>
              <span className={styles.statLabel}>Entry Credits</span>
            </div>
          </div>
          <div className={styles.infoStat}>
            <i className="fas fa-trophy"></i>
            <div>
              <span className={styles.statValue}>{competition.prize_credits || 'TBD'}</span>
              <span className={styles.statLabel}>Prize Pool</span>
            </div>
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
                  <span className={styles.playerName}>
                    {entry.user?.display_name || entry.user?.username || 'Unknown Player'}
                  </span>
                  <span className={styles.teamInfo}>
                    <i className="fas fa-users"></i>
                    {entry.golfer_ids.length} golfers
                  </span>
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
