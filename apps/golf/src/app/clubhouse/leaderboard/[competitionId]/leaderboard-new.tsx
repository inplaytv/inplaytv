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
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(0.15);
  const [backgroundOverlay, setBackgroundOverlay] = useState<number>(0.4);

  useEffect(() => {
    fetchLeaderboard();
    loadBackground();
    const interval = setInterval(fetchLeaderboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [selectedRound]);

  async function loadBackground() {
    try {
      const response = await fetch('/api/settings/page-background?page=clubhouse_leaderboard_background');
      const data = await response.json();
      if (data.backgroundUrl && data.backgroundUrl !== 'none') {
        setBackgroundImage(data.backgroundUrl);
        setBackgroundOpacity(data.opacity ?? 0.15);
        setBackgroundOverlay(data.overlay ?? 0.4);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  }

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
        .select('id, name')
        .eq('event_id', compData.event_id)
        .order('created_at');

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
        .in('status', ['draft', 'upcoming', 'open', 'live', 'completed'])
        .order('start_date', { ascending: false })
        .limit(20);

      if (eventsData) {
        setAllEvents(eventsData);
      }

      // SET COMPETITION FIRST - before any API calls that might fail
      setCompetition({
        ...compData,
        event: eventData || { id: '', name: '', status: '' }
      });

      // Fetch entries with picks
      const { data: entriesData } = await supabase
        .from('clubhouse_entries')
        .select(`
          *,
          clubhouse_entry_picks (
            golfer_id,
            is_captain,
            pick_order
          )
        `)
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

      // Fetch golfers from entry picks
      const allGolferIds = [...new Set(entriesData.flatMap((e: any) => 
        (e.clubhouse_entry_picks || []).map((p: any) => p.golfer_id)
      ))];
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
      const enrichedEntries = entriesData.map((entry: any, idx) => {
        const profile = profileMap.get(entry.user_id);
        const entryScoring = scoringData.entries?.find((e: any) => e.entryId === entry.id);
        
        // Get golfer IDs and captain from picks
        const picks = entry.clubhouse_entry_picks || [];
        const golferIds = picks.map((p: any) => p.golfer_id);
        const captainPick = picks.find((p: any) => p.is_captain);
        
        const golferScores = golferIds.map((id: string) => {
          const golfer = golferMap.get(id);
          const golferScoring = entryScoring?.golfers?.find((g: any) => g.golferId === id);
          return {
            id,
            name: golfer?.name || 'Unknown',
            score: golferScoring?.score || 0,
            fantasyPoints: golferScoring?.fantasyPoints || 0,
            isCaptain: id === captainPick?.golfer_id,
            position: golferScoring?.position || '—',
            thru: golferScoring?.thru || '—'
          };
        });

        return {
          id: entry.id,
          user_id: entry.user_id,
          golfer_ids: golferIds,
          captain_id: captainPick?.golfer_id || null,
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
    // For clubhouse, just use the competition name
    return comp.name;
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
        {/* Background Image */}
        {backgroundImage && (
          <>
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: backgroundOpacity,
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'black',
                opacity: backgroundOverlay,
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />
          </>
        )}
        {/* Compact Header - Always Visible */}
        <div className={styles.compactHeader}>
          <div className={styles.topBar}>
            <Link href="/clubhouse/events" className={styles.backBtn}>
              ← Back
            </Link>
            
            {/* Event Selector Dropdown */}
            <select 
              className={styles.eventSelector}
              value={competition?.event?.id || ''}
              onChange={async (e) => {
                const selectedEventId = e.target.value;
                if (selectedEventId && selectedEventId !== competition?.event?.id) {
                  // Fetch first competition for selected event
                  const supabase = createClient();
                  const { data: comp } = await supabase
                    .from('clubhouse_competitions')
                    .select('id')
                    .eq('event_id', selectedEventId)
                    .order('created_at')
                    .limit(1)
                    .single();
                  
                  if (comp) {
                    window.location.href = `/clubhouse/leaderboard/${comp.id}`;
                  }
                }
              }}
            >
              {allEvents.length > 0 ? (
                allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))
              ) : (
                <option value={competition?.event?.id || ''}>{competition?.event?.name || 'Loading...'}</option>
              )}
            </select>

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
        {currentUserEntry && (() => {
          const displayEntry = selectedEntryId 
            ? entries.find(e => e.id === selectedEntryId) || currentUserEntry
            : currentUserEntry;
          return (
          <div className={styles.yourEntryCard}>
            <div className={styles.yourEntryHeader}>
              <span className={styles.yourBadge}>
                {selectedEntryId && displayEntry.id !== currentUserEntry.id 
                  ? displayEntry.user.display_name.toUpperCase() + "'S TEAM"
                  : 'YOUR TEAM'}
              </span>
              <div className={styles.yourPosition}>
                {displayEntry.position === 1 ? '🥇' : 
                 displayEntry.position === 2 ? '🥈' :
                 displayEntry.position === 3 ? '🥉' : 
                 `#${displayEntry.position}`}
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
                  <span className={displayEntry.total_score < 0 ? styles.scoreUnder : styles.scoreOver}>
                    {displayEntry.total_score > 0 ? '+' : ''}{displayEntry.total_score}
                  </span>
                </div>
                <div className={styles.scoreGroup}>
                  <div className={styles.scoreLabel}>Fantasy Points</div>
                  <span className={styles.fantasyPoints}>
                    {displayEntry.total_fantasy_points.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.yourGolfers}>
              {displayEntry.golfers.map(g => (
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
          );
        })()}

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
                      Build Your Team
                    </Link>
                  </div>
                </div>
              ) : (
              entries.map(entry => (
                <div
                  key={entry.id}
                  className={`${styles.entryRow} ${entry.isCurrentUser ? styles.highlightUser : ''} ${selectedEntryId === entry.id ? styles.selectedEntry : ''}`}
                  onClick={() => setSelectedEntryId(entry.id)}
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
