'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import styles from './leaderboard-modern.module.css';

interface GolferScore {
  id: string;
  name: string;
  score: number;
  fantasyPoints: number;
  isCaptain: boolean;
  position?: string;
  thru?: string;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  golfer_ids: string[];
  captain_id: string;
  user: {
    display_name: string;
    username: string;
  };
  golfers: GolferScore[];
  total_score: number;
  total_fantasy_points: number;
  position: number;
  isCurrentUser?: boolean;
}

interface Competition {
  id: string;
  name: string;
  entry_credits: number;
  prize_credits: number;
  rounds_covered: number[];
  event: {
    id: string;
    name: string;
    status: string;
  };
}

export default function ModernLeaderboardPage() {
  const params = useParams();
  const { user } = useAuth();
  const competitionId = params.competitionId as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>(competitionId);
  const [allEvents, setAllEvents] = useState<Array<{id: string, name: string, slug: string}>>([]);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [selectedRound]);

  async function fetchLeaderboard() {
    try {
      setFetching(true);
      const supabase = createClient();
      
      // Fetch competition
      const { data: compData } = await supabase
        .from('clubhouse_competitions')
        .select('*')
        .eq('id', selectedRound)
        .single();

      if (!compData) {
        setLoading(false);
        setFetching(false);
        return;
      }

      // Fetch all competitions for round selector
      const { data: allCompsData } = await supabase
        .from('clubhouse_competitions')
        .select('id, name, rounds_covered')
        .eq('event_id', compData.event_id)
        .order('rounds_covered');

      if (allCompsData) {
        setAllCompetitions(allCompsData as any);
      }

      // Fetch event
      const { data: eventData } = await supabase
        .from('clubhouse_events')
        .select('id, name, status')
        .eq('id', compData.event_id)
        .single();

      // Fetch all events for selector
      const { data: eventsData } = await supabase
        .from('clubhouse_events')
        .select('id, name, slug')
        .in('status', ['open', 'live', 'completed'])
        .order('start_date', { ascending: false })
        .limit(10);

      if (eventsData) {
        setAllEvents(eventsData);
      }

      // SET COMPETITION FIRST - before any API calls that might fail
      setCompetition({
        ...compData,
        event: eventData || { id: '', name: '', status: '' }
      });

      // Fetch entries
      const { data: entriesData } = await supabase
        .from('clubhouse_entries')
        .select('*')
        .eq('competition_id', selectedRound)
        .eq('status', 'active');

      if (!entriesData || entriesData.length === 0) {
        setEntries([]);
        setLoading(false);
        setFetching(false);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(entriesData.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Fetch golfers
      const allGolferIds = [...new Set(entriesData.flatMap(e => e.golfer_ids))];
      const { data: golfers } = await supabase
        .from('golfers')
        .select('id, first_name, last_name')
        .in('id', allGolferIds);

      const golferMap = new Map(golfers?.map(g => [g.id, {
        id: g.id,
        name: `${g.first_name[0]}. ${g.last_name}`,
        fullName: `${g.first_name} ${g.last_name}`
      }]) || []);

      // Fetch fantasy scores from scoring API (HANDLE FAILURE GRACEFULLY)
      let scoringData: any = { entries: [] };
      try {
        const response = await fetch(`/api/clubhouse/calculate-scores?competitionId=${selectedRound}`);
        if (response.ok) {
          scoringData = await response.json();
        } else {
          console.warn('Scoring API failed, using fallback scores');
        }
      } catch (apiError) {
        console.warn('Scoring API error, using fallback scores:', apiError);
      }

      // Build leaderboard with real fantasy scores
      const enrichedEntries = entriesData.map((entry, idx) => {
        const profile = profileMap.get(entry.user_id);
        const entryScoring = scoringData.entries?.find((e: any) => e.entryId === entry.id);
        
        const golferScores = entry.golfer_ids.map((id: string) => {
          const golfer = golferMap.get(id);
          const golferScoring = entryScoring?.golfers?.find((g: any) => g.golferId === id);
          return {
            id,
            name: golfer?.name || 'Unknown',
            score: golferScoring?.score || 0,
            fantasyPoints: golferScoring?.fantasyPoints || 0,
            isCaptain: id === entry.captain_id,
            position: golferScoring?.position || '—',
            thru: golferScoring?.thru || '—'
          };
        });

        return {
          id: entry.id,
          user_id: entry.user_id,
          golfer_ids: entry.golfer_ids,
          captain_id: entry.captain_id,
          user: profile || { display_name: 'Unknown', username: 'unknown' },
          golfers: golferScores,
          total_score: golferScores.reduce((sum: number, g: GolferScore) => sum + g.score, 0),
          total_fantasy_points: entryScoring?.totalPoints || 0,
          position: 0,
          isCurrentUser: entry.user_id === user?.id
        };
      });

      // Sort by fantasy points (highest first)
      enrichedEntries.sort((a, b) => b.total_fantasy_points - a.total_fantasy_points);
      enrichedEntries.forEach((e, i) => e.position = i + 1);

      setEntries(enrichedEntries);
      setLoading(false);
      setFetching(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setLoading(false);
      setFetching(false);
    }
  }

  const getRoundLabel = (comp: Competition) => {
    if (!comp.rounds_covered || comp.rounds_covered.length === 4) return 'All Rounds';
    if (comp.rounds_covered.length === 1) return `Round ${comp.rounds_covered[0]}`;
    return `Rounds ${comp.rounds_covered.join(', ')}`;
  };

  if (loading && !competition) {
    return (
      <RequireAuth>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading leaderboard...</p>
        </div>
      </RequireAuth>
    );
  }

  const currentUserEntry = entries.find(e => e.isCurrentUser);

  return (
    <RequireAuth>
      <div className={styles.pageContainer}>
        {/* Compact Header - Always Visible */}
        <div className={styles.compactHeader}>
          <div className={styles.topBar}>
            <Link href="/clubhouse/events" className={styles.backBtn}>
              ← Back
            </Link>
            
            {/* Event Selector Dropdown */}
            {allEvents.length > 1 ? (
              <select 
                className={styles.eventSelector}
                value={competition?.event?.id || ''}
                onChange={(e) => {
                  const event = allEvents.find(ev => ev.id === e.target.value);
                  if (event) window.location.href = `/clubhouse/events/${event.slug}`;
                }}
              >
                {allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            ) : (
              <h1 className={styles.eventTitle}>{competition?.event?.name || 'Loading...'}</h1>
            )}

            <Link href="/how-to-play" className={styles.rulesLink} target="_blank">
              <i className="fas fa-info-circle"></i>
              <span className={styles.rulesText}>Rules</span>
            </Link>
            
            {competition?.event?.status === 'live' && (
              <div className={styles.liveIndicator}>
                <span className={styles.liveDot}></span>
                LIVE
              </div>
            )}
          </div>
        </div>

        {/* Current User Card (if entered) */}
        {currentUserEntry && (
          <div className={styles.yourEntryCard}>
            <div className={styles.yourEntryHeader}>
              <span className={styles.yourBadge}>YOUR TEAM</span>
              <div className={styles.yourPosition}>
                {currentUserEntry.position === 1 ? '🥇' : 
                 currentUserEntry.position === 2 ? '🥈' :
                 currentUserEntry.position === 3 ? '🥉' : 
                 `#${currentUserEntry.position}`}
              </div>
              
              {/* Round Tabs Inline with Your Team */}
              {allCompetitions.length > 1 && (
                <div className={styles.roundTabsInline}>
                  {allCompetitions.map(comp => (
                    <button
                      key={comp.id}
                      className={`${styles.roundTabSmall} ${selectedRound === comp.id ? styles.active : ''}`}
                      onClick={() => setSelectedRound(comp.id)}
                    >
                      {getRoundLabel(comp)}
                    </button>
                  ))}
                </div>
              )}
              
              <div className={styles.yourScore}>
                <div className={styles.scoreGroup}>
                  <div className={styles.scoreLabel}>Golf Score</div>
                  <span className={currentUserEntry.total_score < 0 ? styles.scoreUnder : styles.scoreOver}>
                    {currentUserEntry.total_score > 0 ? '+' : ''}{currentUserEntry.total_score}
                  </span>
                </div>
                <div className={styles.scoreGroup}>
                  <div className={styles.scoreLabel}>Fantasy Points</div>
                  <span className={styles.fantasyPoints}>
                    {currentUserEntry.total_fantasy_points.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.yourGolfers}>
              {currentUserEntry.golfers.map(g => (
                <div key={g.id} className={`${styles.golferPill} ${g.isCaptain ? styles.captain : ''}`}>
                  <span className={styles.golferName}>{g.name}</span>
                  <span className={styles.golferPos}>T{g.position}</span>
                  <span className={g.score < 0 ? styles.scoreUnder : styles.scoreOver}>
                    {g.score > 0 ? '+' : ''}{g.score}
                  </span>
                  {g.isCaptain && <span className={styles.captainStar}>⭐</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round Selector - Show when no user entry */}
        {!currentUserEntry && allCompetitions.length > 1 && (
          <div className={styles.roundSelectorBar}>
            {allCompetitions.map(comp => (
              <button
                key={comp.id}
                className={`${styles.roundTabSmall} ${selectedRound === comp.id ? styles.active : ''}`}
                onClick={() => setSelectedRound(comp.id)}
              >
                {getRoundLabel(comp)}
              </button>
            ))}
          </div>
        )}

        {/* Leaderboard Table - Always Visible */}
        <div className={styles.leaderboardContainer}>
          <div className={styles.tableHeader}>
            <div style={{ width: '50px' }}>Pos</div>
            <div style={{ flex: 1 }}>Player & Team</div>
            <div style={{ width: '80px', textAlign: 'right' }}>Golf</div>
            <div style={{ width: '100px', textAlign: 'right' }}>Fantasy Pts</div>
          </div>

            <div className={styles.tableBody}>
              {!competition ? (
                <div className={styles.emptyStateInline}>
                  <p>Loading competition...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className={styles.emptyStateInline}>
                  <p>No entries yet for this round</p>
                  <div className={styles.emptyActions}>
                    <Link href={`/clubhouse/build-team/${competition.id}`} className={styles.enterBtnSmall}>
                      Enter Competition
                    </Link>
                  </div>
                </div>
              ) : (
              entries.map(entry => (
                <div 
                  key={entry.id}
                  className={`${styles.entryRow} ${entry.isCurrentUser ? styles.highlightUser : ''} ${expandedEntry === entry.id ? styles.expanded : ''}`}
                  onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}
                >
                  <div className={styles.entryMain}>
                    <div className={styles.positionCell}>
                      {entry.position === 1 ? '🥇' :
                       entry.position === 2 ? '🥈' :
                       entry.position === 3 ? '🥉' :
                       entry.position}
                    </div>
                    <div className={styles.playerCell}>
                      <div className={styles.playerName}>
                        {entry.user.display_name}
                        {entry.isCurrentUser && <span className={styles.youBadge}>YOU</span>}
                      </div>
                      <div className={styles.golferSummary}>
                        {entry.golfers.slice(0, 3).map(g => g.name).join(', ')}
                        {entry.golfers.length > 3 && ` +${entry.golfers.length - 3} more`}
                      </div>
                    </div>
                    <div className={styles.scoreCell}>
                      <span className={entry.total_score < 0 ? styles.scoreUnder : styles.scoreOver}>
                        {entry.total_score > 0 ? '+' : ''}{entry.total_score}
                      </span>
                    </div>
                    <div className={styles.fantasyCell}>
                      <span className={styles.fantasyPoints}>
                        {entry.total_fantasy_points.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedEntry === entry.id && (
                    <div className={styles.entryDetails}>
                      {entry.golfers.map(g => (
                        <div key={g.id} className={styles.golferDetailCard}>
                          <div className={styles.golferDetailRow}>
                            <span className={styles.golferDetailName}>
                              {g.name}
                              {g.isCaptain && <span className={styles.captainBadge}>C</span>}
                            </span>
                            <span className={styles.golferDetailPos}>T{g.position}</span>
                            <span className={styles.golferDetailThru}>Thru {g.thru}</span>
                            <span className={g.score < 0 ? styles.scoreUnder : styles.scoreOver}>
                              {g.score > 0 ? '+' : ''}{g.score}
                            </span>
                            <span className={styles.golferFantasy}>
                              {g.fantasyPoints} pts{g.isCaptain ? ' (x2)' : ''}
                            </span>
                          </div>
                          <div className={styles.holeScores}>
                            {Array.from({length: 18}, (_, i) => (
                              <div key={i} className={styles.holeBox}>
                                <div className={styles.holeNumber}>{i + 1}</div>
                                <div className={styles.holeScore}>—</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Stats - Always Visible */}
        <div className={styles.footerStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{entries.length}</span>
              <span className={styles.statLabel}>Total Entries</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{competition?.prize_credits || 'TBD'}</span>
              <span className={styles.statLabel}>Prize Pool</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {competition?.event?.status === 'live' ? '30s' : '-'}
              </span>
              <span className={styles.statLabel}>Update Freq</span>
            </div>
          </div>
      </div>
    </RequireAuth>
  );
}
