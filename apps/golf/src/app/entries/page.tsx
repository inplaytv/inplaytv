'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import styles from './entries.module.css';

export const dynamic = 'force-dynamic';

interface Entry {
  id: string;
  entry_name: string | null;
  created_at: string;
  entry_fee_paid: number;
  entry_fee_pennies?: number; // For ONE 2 ONE
  admin_fee_percent?: number; // For ONE 2 ONE
  competition_id: string;
  instance_id?: string; // For ONE 2 ONE competitions
  tournament_competitions: {
    id: string;
    start_date: string;
    end_date: string;
    entry_fee_pennies?: number;
    admin_fee_percent?: number;
    is_one_2_one?: boolean;
    match_status?: string;
    current_players?: number;
    max_players?: number;
    creator_user_id?: string;
    tournaments: {
      name: string;
      status: string;
    };
    competition_types: {
      name: string;
    };
  };
  entry_picks: Array<{
    golfer_id: string;
    is_captain: boolean;
  }>;
}

interface CompetitionEntrant {
  id: string;
  entry_name: string | null;
  user_id: string;
  total_salary: number;
  created_at: string;
  profiles?: {
    username: string;
  };
}

  interface EntryPick {
    golfer_id: string;
    is_captain: boolean;
    slot_position: number;
    salary: number;
    golfers: {
      first_name: string;
      last_name: string;
      world_ranking: number | null;
    };
  }export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [competitionEntrants, setCompetitionEntrants] = useState<CompetitionEntrant[]>([]);
  const [loadingEntrants, setLoadingEntrants] = useState(false);
  const [maxEntries, setMaxEntries] = useState<number>(0);
  const [firstPrize, setFirstPrize] = useState<number>(0);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [entryPicks, setEntryPicks] = useState<EntryPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchEntries();
    
    // Poll for ONE 2 ONE status updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchEntries();
    }, 10000);
    
    return () => clearInterval(pollInterval);
  }, []);

  async function fetchCurrentUser() {
    try {
      const res = await fetch('/api/auth/user');
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.user?.id || null);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  useEffect(() => {
    if (selectedTournamentId && entries.length > 0) {
      const tournamentEntries = entries.filter(e => e.tournament_competitions?.tournaments?.name === selectedTournamentId);
      if (tournamentEntries.length > 0) {
        const compId = tournamentEntries[0].competition_id || tournamentEntries[0].instance_id;
        if (compId) {
          fetchCompetitionEntrants(compId);
        }
      }
    }
  }, [selectedTournamentId, entries]);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/user/my-entries', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      const fetchedEntries = data.entries || [];
      setEntries(fetchedEntries);
      // Auto-select first tournament if entries exist
      if (fetchedEntries.length > 0 && !selectedTournamentId && fetchedEntries[0].tournament_competitions?.tournaments?.name) {
        setSelectedTournamentId(fetchedEntries[0].tournament_competitions.tournaments.name);
      }
    } catch (error) {
      console.error('❌ Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCompetitionEntrants(competitionId: string) {
    setLoadingEntrants(true);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/entrants`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('❌ Entrants API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch entrants');
      }
      const data = await res.json();
      setCompetitionEntrants(data.entrants || []);
      setMaxEntries(data.maxEntries || 0);
      setFirstPrize(data.firstPrize || 0);
    } catch (error) {
      console.error('Error fetching entrants:', error);
      setCompetitionEntrants([]);
    } finally {
      setLoadingEntrants(false);
    }
  }

  async function fetchEntryPicks(entryId: string) {
    setLoadingPicks(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/picks-with-golfers`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch entry picks');
      }
      const data = await res.json();
      setEntryPicks(data.picks || []);
    } catch (error) {
      console.error('Error fetching entry picks:', error);
      setEntryPicks([]);
      alert(error instanceof Error ? error.message : 'Failed to load entry details');
    } finally {
      setLoadingPicks(false);
    }
  }

  function handleEntryClick(entryId: string, userId: string) {
    console.log('Entry clicked:', { entryId, userId, currentUserId });
    
    // Users can always view their own entries
    if (userId === currentUserId) {
      setSelectedEntryId(entryId);
      fetchEntryPicks(entryId);
      return;
    }

    // Other users' entries can only be viewed if tournament has started
    const selectedTournament = tournaments.find(t => t.tournamentName === selectedTournamentId);
    if (selectedTournament) {
      const now = new Date();
      const startDate = new Date(selectedTournament.competition.start_date);
      
      if (now >= startDate) {
        // Tournament has started, allow viewing
        setSelectedEntryId(entryId);
        fetchEntryPicks(entryId);
      } else {
        // Tournament hasn't started, show message
        alert('You can view other entries once the tournament starts!');
      }
    }
  }

  function closeEntryPopup() {
    setSelectedEntryId(null);
    setEntryPicks([]);
  }

  function getStatus(entry: Entry): 'live' | 'registration_open' | 'completed' {
    if (!entry.tournament_competitions) return 'registration_open';
    const now = new Date();
    const startDate = new Date(entry.tournament_competitions.start_date);
    const endDate = new Date(entry.tournament_competitions.end_date);
    
    if (now >= startDate && now <= endDate) return 'live';
    if (now < startDate) return 'registration_open';
    return 'completed';
  }

  function isRecentlyCompleted(entry: Entry): boolean {
    if (!entry.tournament_competitions) return true;
    const now = new Date();
    const endDate = new Date(entry.tournament_competitions.end_date);
    const hoursSinceEnd = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
    return hoursSinceEnd <= 24;
  }

  // Group entries by tournament
  const groupedEntries = entries.reduce((acc, entry) => {
    const tournamentName = entry.tournament_competitions?.tournaments?.name;
    if (!tournamentName || !entry.tournament_competitions) return acc;
    
    if (!acc[tournamentName]) {
      acc[tournamentName] = {
        tournamentName: tournamentName,
        tournament: entry.tournament_competitions.tournaments,
        competition: entry.tournament_competitions,
        entries: []
      };
    }
    acc[tournamentName].entries.push(entry);
    return acc;
  }, {} as Record<string, { tournamentName: string, tournament: any, competition: Entry['tournament_competitions'], entries: Entry[] }>);

  const allTournaments = Object.values(groupedEntries);
  
  // Filter based on history view
  const tournaments = allTournaments.filter(tournament => {
    const sampleEntry = tournament.entries[0];
    const status = getStatus(sampleEntry);
    const isRecent = isRecentlyCompleted(sampleEntry);
    
    if (showHistory) {
      return status === 'completed' && !isRecent;
    } else {
      return status !== 'completed' || isRecent;
    }
  });
  
  const archivedCount = allTournaments.filter(tournament => {
    const sampleEntry = tournament.entries[0];
    const status = getStatus(sampleEntry);
    const isRecent = isRecentlyCompleted(sampleEntry);
    return status === 'completed' && !isRecent;
  }).length;

  return (
    <RequireAuth>
      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '20px',
        minHeight: '100vh'
      }}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your scorecards...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏌️</div>
            <h2>No Scorecards Yet</h2>
            <p>Create your first team to get started</p>
            <button
              className={styles.cta}
              onClick={() => router.push('/tournaments')}
            >
              <i className="fas fa-plus"></i>
              Build Your Team
            </button>
          </div>
        ) : (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: selectedEntryId 
              ? 'repeat(auto-fit, minmax(300px, 1fr))' 
              : 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '30px',
            alignItems: 'start',
            transition: 'all 0.3s ease'
          }}>
            {/* Left Column: User's Scorecards */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: '0 0 8px 0' }}>
                    My Scorecards
                  </h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => setShowHistory(false)}
                      style={{
                        padding: '4px 12px',
                        background: !showHistory ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: !showHistory ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: !showHistory ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Active
                    </button>
                    <button
                      onClick={() => setShowHistory(true)}
                      style={{
                        padding: '4px 12px',
                        background: showHistory ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        border: showHistory ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: showHistory ? '#a78bfa' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      📜 History {archivedCount > 0 && `(${archivedCount})`}
                    </button>
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetchEntries();
                      }}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '6px',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <i className="fas fa-sync" style={{ fontSize: '10px' }}></i>
                      Refresh
                    </button>
                  </div>
                </div>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  Your Entries ({entries.length})
                </span>
              </div>

              {/* 30-day retention notice for History */}
              {showHistory && (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <i className="fas fa-info-circle" style={{ color: '#f59e0b', fontSize: '16px' }}></i>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                    Historic data will be automatically removed after 30 days
                  </span>
                </div>
              )}

              <div style={{ display: 'grid', gap: '12px' }}>
                {tournaments.map((tournament) => {
                  const status = tournament.entries.length > 0 ? getStatus(tournament.entries[0]) : 'registration_open';
                  const isSelected = selectedTournamentId === tournament.tournamentName;
                  return (
                    <div 
                      key={tournament.tournamentName} 
                      onClick={() => setSelectedTournamentId(tournament.tournamentName)}
                      style={{
                        padding: '16px',
                        background: isSelected 
                          ? 'rgba(251, 191, 36, 0.15)' 
                          : 'rgba(255,255,255,0.05)',
                        border: isSelected
                          ? '1px solid rgba(251, 191, 36, 0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: status === 'live' ? '#10b981' : status === 'registration_open' ? '#fbbf24' : '#6b7280'
                        }}></div>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: 600, 
                          textTransform: 'uppercase',
                          color: status === 'live' ? '#10b981' : status === 'registration_open' ? '#fbbf24' : 'rgba(255,255,255,0.5)'
                        }}>
                          {status === 'live' ? 'Live Now' : status === 'registration_open' ? 'Registration Open' : 'Completed'}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: '0 0 8px 0' }}>
                        {tournament.tournamentName}
                      </h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {tournament.entries.length} {tournament.entries.length === 1 ? 'Entry' : 'Entries'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Middle Column: Tournament Entries */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              {(() => {
                const selectedTournament = tournaments.find(t => t.tournamentName === selectedTournamentId);
                return (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      {selectedTournament ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                              {selectedTournament.tournamentName}
                            </h2>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Your Entries</span>
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                              {selectedTournament.entries.length} {selectedTournament.entries.length === 1 ? 'Entry' : 'Entries'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                          Tournament Entries
                        </h2>
                      )}
                    </div>

              {!selectedTournamentId ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <i className="fas fa-trophy" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                  <p style={{ fontSize: '14px', margin: 0 }}>Select a tournament to view your entries</p>
                </div>
              ) : selectedTournament && selectedTournament.entries.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <i className="fas fa-users" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                  <p style={{ fontSize: '14px', margin: 0 }}>No entries yet</p>
                </div>
              ) : selectedTournament ? (
                <div style={{ 
                  display: 'grid', 
                  gap: '8px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {selectedTournament.entries.map((entry, index) => (
                    <div 
                      key={entry.id}
                      onClick={() => handleEntryClick(entry.id, currentUserId || '')}
                      style={{
                        padding: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(251, 191, 36, 0.2)',
                          border: '1px solid rgba(251, 191, 36, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#fbbf24'
                        }}>
                          {index + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                                {entry.entry_name || 'Anonymous Entry'}
                              </p>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: 600, 
                                color: 'rgba(255,255,255,0.5)', 
                                background: 'rgba(255,255,255,0.1)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontFamily: 'monospace'
                              }}>
                                #{entry.id.split('-')[0].toUpperCase()}
                              </span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 500 }}>
                              {entry.tournament_competitions?.competition_types?.name || 'Competition'}
                            </span>
                          </div>
                          {/* ONE 2 ONE Match Status */}
                          {entry.tournament_competitions?.is_one_2_one && (
                            <div style={{ marginTop: '4px', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {(() => {
                                  const currentPlayers = entry.tournament_competitions.current_players ?? 0;
                                  const maxPlayers = entry.tournament_competitions.max_players ?? 2;
                                  const isCreator = entry.tournament_competitions.creator_user_id === currentUserId;
                                  const isFull = currentPlayers >= maxPlayers;
                                  
                                  // If match is not full yet
                                  if (!isFull) {
                                    return (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#fbbf24',
                                        background: 'rgba(251, 191, 36, 0.15)',
                                        border: '1px solid rgba(251, 191, 36, 0.3)',
                                        borderRadius: '12px',
                                        padding: '3px 8px',
                                        width: 'fit-content'
                                      }}>
                                        🟡 Waiting for opponent
                                      </span>
                                    );
                                  }
                                  
                                  // Match is full - show different message based on creator status
                                  if (isCreator) {
                                    return (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '12px',
                                        padding: '3px 8px',
                                        width: 'fit-content'
                                      }}>
                                        🟢 Opponent Found
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: '#10b981',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        borderRadius: '12px',
                                        padding: '3px 8px',
                                        width: 'fit-content'
                                      }}>
                                        🟢 Challenge Accepted
                                      </span>
                                    );
                                  }
                                })()}
                              </div>
                              <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                Prize Pool: £{(() => {
                                  // For ONE 2 ONE, entry_fee_pennies is at root level
                                  // For regular competitions, it's nested in tournament_competitions
                                  const entryFee = entry.entry_fee_pennies || entry.tournament_competitions?.entry_fee_pennies || 0;
                                  const adminFeePercent = entry.admin_fee_percent || 10; // ONE 2 ONE uses template's admin fee
                                  return ((entryFee * 2 * (100 - adminFeePercent)) / 100 / 100).toFixed(2);
                                })()}
                              </span>
                            </div>
                          )}
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                            {new Date(entry.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
                  </>
                );
              })()}
            </div>

            {/* Right Column: Entry Details (Appears on same page) */}
            {selectedEntryId && (
              <div style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: '16px',
                backdropFilter: 'blur(16px)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                maxHeight: '800px',
                overflowY: 'auto',
                position: 'relative'
              }}>
                <button
                  onClick={closeEntryPopup}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '18px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 0, 0, 0.3)';
                    e.currentTarget.style.borderColor = 'rgba(255, 0, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ×
                </button>

                <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24', marginBottom: '8px' }}>
                  Entry Details
                </h2>
                {(() => {
                  const selectedEntry = entries.find(e => e.id === selectedEntryId);
                  return (
                    <>
                      <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '4px' }}>
                        {selectedEntry?.entry_name || 'Team Lineup'}
                      </p>
                      {selectedEntry && (
                        <>
                          <p style={{ fontSize: '12px', color: '#10b981', fontWeight: 500, marginBottom: '4px' }}>
                            {selectedEntry.tournament_competitions?.competition_types?.name || 'Competition'}
                          </p>
                          {selectedEntry.tournament_competitions?.is_one_2_one && (
                            <p style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700, marginBottom: '24px' }}>
                              Prize Pool: £{(() => {
                                // For ONE 2 ONE, entry_fee_pennies is at root level
                                // For regular competitions, it's nested in tournament_competitions
                                const entryFee = selectedEntry.entry_fee_pennies || selectedEntry.tournament_competitions?.entry_fee_pennies || 0;
                                const adminFeePercent = selectedEntry.admin_fee_percent || 10; // ONE 2 ONE uses template's admin fee
                                return ((entryFee * 2 * (100 - adminFeePercent)) / 100 / 100).toFixed(2);
                              })()}
                            </p>
                          )}
                        </>
                      )}
                    </>
                  );
                })()}

                {loadingPicks ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div className={styles.spinner}></div>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '12px' }}>
                      Loading team...
                    </p>
                  </div>
                ) : entryPicks.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      No golfers found for this entry
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {entryPicks.map((pick, index) => {
                      const golferData: any = pick.golfers;
                      const firstName = Array.isArray(golferData) ? golferData[0]?.first_name : golferData?.first_name;
                      const lastName = Array.isArray(golferData) ? golferData[0]?.last_name : golferData?.last_name;
                      const worldRanking = Array.isArray(golferData) ? golferData[0]?.world_ranking : golferData?.world_ranking;
                      const salary = pick.salary || 0;

                      return (
                        <div
                          key={index}
                          style={{
                            padding: '16px',
                            background: pick.is_captain 
                              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)'
                              : 'rgba(255, 255, 255, 0.05)',
                            border: pick.is_captain
                              ? '1px solid rgba(251, 191, 36, 0.4)'
                              : '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            <span
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: pick.is_captain 
                                  ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                  : 'rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: pick.is_captain ? '#000' : 'rgba(255, 255, 255, 0.7)',
                                flexShrink: 0
                              }}
                            >
                              {pick.is_captain ? 'C' : index + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <p style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                                  {firstName} {lastName}
                                </p>
                                {pick.is_captain && (
                                  <span style={{
                                    padding: '2px 8px',
                                    background: '#fbbf24',
                                    color: '#000',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    textTransform: 'uppercase'
                                  }}>
                                    Captain
                                  </span>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: '2px 0 0 0' }}>
                                OWGR: {worldRanking || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '16px', fontWeight: 700, color: '#10b981', margin: 0 }}>
                              £{salary.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


      </main>
    </RequireAuth>
  );
}
