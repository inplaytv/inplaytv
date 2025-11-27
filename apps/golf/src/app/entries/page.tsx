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
  competition_id: string;
  tournament_competitions: {
    id: string;
    start_date: string;
    end_date: string;
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
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [competitionEntrants, setCompetitionEntrants] = useState<CompetitionEntrant[]>([]);
  const [loadingEntrants, setLoadingEntrants] = useState(false);
  const [maxEntries, setMaxEntries] = useState<number>(0);
  const [firstPrize, setFirstPrize] = useState<number>(0);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [entryPicks, setEntryPicks] = useState<EntryPick[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchEntries();
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
    if (selectedCompetitionId) {
      fetchCompetitionEntrants(selectedCompetitionId);
    }
  }, [selectedCompetitionId]);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/user/my-entries');
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      const fetchedEntries = data.entries || [];
      setEntries(fetchedEntries);
      // Auto-select first competition if entries exist
      if (fetchedEntries.length > 0 && !selectedCompetitionId && fetchedEntries[0].competition_id) {
        setSelectedCompetitionId(fetchedEntries[0].competition_id);
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
      if (!res.ok) throw new Error('Failed to fetch entrants');
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
    const selectedComp = competitions.find(c => c.competitionId === selectedCompetitionId);
    if (selectedComp) {
      const now = new Date();
      const startDate = new Date(selectedComp.competition.start_date);
      
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

  // Group entries by competition
  const groupedEntries = entries.reduce((acc, entry) => {
    const compId = entry.competition_id;
    if (!compId || !entry.tournament_competitions) return acc;
    
    if (!acc[compId]) {
      acc[compId] = {
        competitionId: compId,
        competition: entry.tournament_competitions,
        entries: []
      };
    }
    acc[compId].entries.push(entry);
    return acc;
  }, {} as Record<string, { competitionId: string, competition: Entry['tournament_competitions'], entries: Entry[] }>);

  const competitions = Object.values(groupedEntries);

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
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                  My Scorecards
                </h2>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                  Your Entries ({entries.length})
                </span>
              </div>
              <div style={{ display: 'grid', gap: '12px' }}>
                {competitions.map((comp) => {
                  const status = comp.entries.length > 0 ? getStatus(comp.entries[0]) : 'registration_open';
                  const isSelected = selectedCompetitionId === comp.competitionId;
                  return (
                    <div 
                      key={comp.competitionId} 
                      onClick={() => setSelectedCompetitionId(comp.competitionId)}
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
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: '0 0 4px 0' }}>
                        {comp.competition.tournaments?.name || 'Tournament'}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#10b981', margin: '0 0 8px 0', fontWeight: 500 }}>
                        {comp.competition.competition_types?.name || 'Competition'}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                          {comp.entries.length} {comp.entries.length === 1 ? 'Entry' : 'Entries'}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                          £{((comp.entries[0]?.entry_fee_paid || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Competition Leaderboard */}
            <div style={{
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}>
              {(() => {
                const selectedComp = competitions.find(c => c.competitionId === selectedCompetitionId);
                return (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      {selectedComp ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                              {selectedComp.competition.tournaments?.name || 'Tournament'}
                            </h2>
                          </div>
                          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: '0 0 8px 0' }}>
                            {selectedComp.competition.competition_types?.name || 'Competition'}
                          </p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Competition Entries</span>
                            <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                              {competitionEntrants.length}/{maxEntries}
                            </span>
                          </div>
                        </>
                      ) : (
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                          Competition Entrants
                        </h2>
                      )}
                    </div>

              {!selectedCompetitionId ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <i className="fas fa-trophy" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                  <p style={{ fontSize: '14px', margin: 0 }}>Select a scorecard to view entrants</p>
                </div>
              ) : loadingEntrants ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.6)'
                }}>
                  <div className={styles.spinner}></div>
                  <p style={{ fontSize: '14px', marginTop: '12px' }}>Loading entrants...</p>
                </div>
              ) : competitionEntrants.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)'
                }}>
                  <i className="fas fa-users" style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.5 }}></i>
                  <p style={{ fontSize: '14px', margin: 0 }}>No other entrants yet</p>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gap: '8px',
                  maxHeight: '600px',
                  overflowY: 'auto',
                  paddingRight: '8px'
                }}>
                  {competitionEntrants.map((entrant, index) => (
                    <div 
                      key={entrant.id}
                      onClick={() => handleEntryClick(entrant.id, entrant.user_id)}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: index < 3 ? '#fbbf24' : 'rgba(255,255,255,0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: index < 3 ? 'black' : 'rgba(255,255,255,0.7)'
                        }}>
                          {index + 1}
                        </span>
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: '0 0 2px 0' }}>
                            {entrant.entry_name || 'Anonymous Entry'}
                          </p>
                          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                            {new Date(entrant.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '24px' }}>
                  {competitionEntrants.find(e => e.id === selectedEntryId)?.entry_name || 'Team Lineup'}
                </p>

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
