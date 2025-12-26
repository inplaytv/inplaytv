'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './TournamentLifecycle.module.css';

interface Tournament {
  id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  timezone: string;
  golfer_count: number;
  competition_count: number;
  entry_count: number;
}

interface StatusTransition {
  tournamentId: string;
  from: string;
  to: string;
  scheduledAt: string | null;
  automatic: boolean;
}

export default function TournamentLifecyclePage() {
  const searchParams = useSearchParams();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [countdowns, setCountdowns] = useState<{ [key: string]: string }>({});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTournaments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-select tournament from URL parameter
  useEffect(() => {
    const tournamentId = searchParams.get('tournament');
    if (tournamentId && tournaments.length > 0) {
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        console.log('[Lifecycle UI] Auto-selecting tournament from URL:', tournament.name);
        setSelectedTournament(tournament);
      } else {
        console.warn('[Lifecycle UI] Tournament not found:', tournamentId);
      }
    }
  }, [searchParams, tournaments]);

  // Update countdown timers every second
  useEffect(() => {
    const updateCountdowns = () => {
      const now = new Date();
      setCurrentTime(now);
      const newCountdowns: { [key: string]: string } = {};

      tournaments.forEach((tournament) => {
        const nowTime = now.getTime();
        const startTime = new Date(tournament.start_date).getTime();
        const endTime = new Date(tournament.end_date).getTime();
        const regOpenTime = tournament.registration_opens_at ? new Date(tournament.registration_opens_at).getTime() : null;
        const regCloseTime = tournament.registration_closes_at ? new Date(tournament.registration_closes_at).getTime() : null;

        let countdownText = '';
        let diff = 0;

        // Determine what to count down to based on current status
        if (tournament.status === 'upcoming' && regOpenTime && nowTime < regOpenTime) {
          diff = regOpenTime - nowTime;
          countdownText = formatCountdown(diff, '📝 Reg Opens in: ');
        } else if (tournament.status === 'registration_open' && regCloseTime && nowTime < regCloseTime) {
          diff = regCloseTime - nowTime;
          countdownText = formatCountdown(diff, '🔒 Reg Closes in: ');
        } else if ((tournament.status === 'upcoming' || tournament.status === 'registration_open') && nowTime < startTime) {
          diff = startTime - nowTime;
          countdownText = formatCountdown(diff, '🏌️ Tournament Starts in: ');
        } else if (tournament.status === 'in_progress' && nowTime < endTime) {
          diff = endTime - nowTime;
          countdownText = formatCountdown(diff, '🏁 Tournament Ends in: ', true);
        } else if (tournament.status === 'in_progress' && nowTime >= endTime) {
          countdownText = '⚠️ Should be Completed';
        } else if (tournament.status === 'completed') {
          countdownText = '✅ Completed';
        } else if (tournament.status === 'cancelled') {
          countdownText = '❌ Cancelled';
        }

        newCountdowns[tournament.id] = countdownText;
      });

      setCountdowns(newCountdowns);
    };

    updateCountdowns();
    const interval = setInterval(updateCountdowns, 1000);
    return () => clearInterval(interval);
  }, [tournaments]);

  function formatCountdown(milliseconds: number, prefix: string, daysOnly: boolean = false): string {
    if (milliseconds <= 0) return '';

    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    let timeStr = '';
    if (daysOnly) {
      timeStr = `${days}d`;
    } else if (days > 0) {
      timeStr = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      timeStr = `${hours}h ${minutes}m ${seconds}s`;
    } else {
      timeStr = `${minutes}m ${seconds}s`;
    }

    return `${prefix}${timeStr}`;
  }

  async function fetchTournaments() {
    try {
      const res = await fetch('/api/tournament-lifecycle');
      if (res.ok) {
        const data = await res.json();
        console.log('[Lifecycle UI] Fetched tournaments:', data.tournaments?.length || 0);
        console.log('[Lifecycle UI] Tournament data:', data.tournaments);
        
        // Sort tournaments: Active at top, completed at bottom
        const sorted = sortTournamentsByPriority(data.tournaments);
        setTournaments(sorted);
        
        console.log('[Lifecycle UI] Active tournaments:', sorted.filter(t => ['in_progress', 'registration_open', 'upcoming'].includes(t.status)).length);
        console.log('[Lifecycle UI] Completed tournaments:', sorted.filter(t => ['completed', 'cancelled'].includes(t.status)).length);
      } else {
        console.error('[Lifecycle UI] Failed to fetch tournaments:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[Lifecycle UI] Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  }

  function sortTournamentsByPriority(tournaments: Tournament[]): Tournament[] {
    // Status priority: in_progress > registration_open > upcoming > completed > cancelled
    const statusPriority: { [key: string]: number } = {
      'in_progress': 1,
      'registration_open': 2,
      'upcoming': 3,
      'completed': 4,
      'cancelled': 5
    };

    return [...tournaments].sort((a, b) => {
      // First, sort by status priority
      const priorityDiff = (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
      if (priorityDiff !== 0) return priorityDiff;

      // Within same status, sort by start date (soonest first for active, most recent first for completed)
      const aDate = new Date(a.start_date).getTime();
      const bDate = new Date(b.start_date).getTime();
      
      if (a.status === 'completed' || a.status === 'cancelled') {
        // For completed/cancelled, show most recent first
        return bDate - aDate;
      } else {
        // For active tournaments, show soonest first
        return aDate - bDate;
      }
    });
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return '#6b7280';
      case 'registration_open': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return '🔜';
      case 'registration_open': return '📝';
      case 'in_progress': return '⛳';
      case 'completed': return '🏆';
      case 'cancelled': return '❌';
      default: return '📌';
    }
  }

  function formatDate(dateString: string | null, timezone?: string, dateOnly: boolean = false): string {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    
    // For date-only display, use UTC to avoid timezone shifts
    if (dateOnly) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      });
    }
    
    // For datetime display (registration windows)
    if (timezone) {
      try {
        return date.toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone
        }) + ` (${timezone.split('/')[1]?.replace('_', ' ') || timezone})`;
      } catch (e) {
        console.error(`Invalid timezone: ${timezone}`, e);
      }
    }
    
    // Default datetime formatting
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getDaysUntil(dateString: string): number {
    const now = new Date();
    const date = new Date(dateString);
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function getTimingText(tournament: any): string {
    const daysUntilStart = getDaysUntil(tournament.start_date);
    const daysUntilEnd = getDaysUntil(tournament.end_date);
    
    // If tournament is completed, show "Finished"
    if (tournament.status === 'completed') {
      return 'Finished';
    }
    
    // If tournament is cancelled
    if (tournament.status === 'cancelled') {
      return 'Cancelled';
    }
    
    // If tournament is in progress
    if (tournament.status === 'in_progress') {
      if (daysUntilEnd >= 0) {
        return `In Progress (${daysUntilEnd}d left)`;
      }
      return 'In Progress';
    }
    
    // For upcoming and registration_open tournaments
    if (daysUntilStart > 0) {
      return `${daysUntilStart}d away`;
    } else if (daysUntilStart === 0) {
      return 'Starts Today';
    } else {
      // Tournament should have started but status hasn't been updated
      return 'Should be In Progress';
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🔄 Tournament Lifecycle Manager</h1>
          <p className={styles.subtitle}>
            Automated status transitions • Timezone-aware registration • Real-time monitoring
          </p>
        </div>
        <button
          onClick={fetchTournaments}
          className={styles.refreshButton}
          disabled={loading}
        >
          <i className="fas fa-sync" style={{ marginRight: '8px' }} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Status Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#6b7280' }} />
          Upcoming - Tournament created
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#10b981' }} />
          Registration Open - Users can register
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
          In Progress - Tournament started
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#8b5cf6' }} />
          Completed - Results finalized
        </div>
      </div>

      {/* Tournaments Grid */}
      {loading && tournaments.length === 0 ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading tournaments...</p>
        </div>
      ) : tournaments.length === 0 ? (
        <div className={styles.empty}>
          <p>No tournaments found</p>
        </div>
      ) : (
        <>
          {/* Active Tournaments Section */}
          {tournaments.some(t => ['in_progress', 'registration_open', 'upcoming'].includes(t.status)) && (
            <>
              <div style={{ 
                marginBottom: '16px', 
                paddingBottom: '12px', 
                borderBottom: '2px solid rgba(59, 130, 246, 0.3)' 
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#3b82f6',
                  margin: 0 
                }}>
                  🎯 Active Tournaments
                </h2>
              </div>
              <div className={styles.grid}>
                {tournaments
                  .filter(t => ['in_progress', 'registration_open', 'upcoming'].includes(t.status))
                  .map((tournament) => (
                    <TournamentCard 
                      key={tournament.id} 
                      tournament={tournament}
                      countdown={countdowns[tournament.id]}
                      currentTime={currentTime}
                      onStatusChange={() => {
                        setSelectedTournament(tournament);
                        setShowStatusModal(true);
                      }}
                      onRegistrationChange={() => {
                        setSelectedTournament(tournament);
                        setShowRegistrationModal(true);
                      }}
                    />
                  ))}
              </div>
            </>
          )}

          {/* Completed Tournaments Section */}
          {tournaments.some(t => ['completed', 'cancelled'].includes(t.status)) && (
            <>
              <div style={{ 
                marginTop: '32px',
                marginBottom: '16px', 
                paddingBottom: '12px', 
                borderBottom: '2px solid rgba(139, 92, 246, 0.3)' 
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: 600, 
                  color: '#8b5cf6',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  📦 Completed Tournaments
                  <span style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 400 }}>
                    ({tournaments.filter(t => ['completed', 'cancelled'].includes(t.status)).length})
                  </span>
                </h2>
              </div>
              <div className={styles.grid}>
                {tournaments
                  .filter(t => ['completed', 'cancelled'].includes(t.status))
                  .map((tournament) => (
                    <TournamentCard 
                      key={tournament.id} 
                      tournament={tournament}
                      countdown={countdowns[tournament.id]}
                      currentTime={currentTime}
                      onStatusChange={() => {
                        setSelectedTournament(tournament);
                        setShowStatusModal(true);
                      }}
                      onRegistrationChange={() => {
                        setSelectedTournament(tournament);
                        setShowRegistrationModal(true);
                      }}
                    />
                  ))}
              </div>
            </>
          )}
        </>
      )}

      {/* Status Change Modal */}
      {showStatusModal && selectedTournament && (
        <StatusChangeModal
          tournament={selectedTournament}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedTournament(null);
          }}
          onSuccess={() => {
            fetchTournaments();
            setShowStatusModal(false);
            setSelectedTournament(null);
          }}
        />
      )}

      {/* Registration Window Modal */}
      {showRegistrationModal && selectedTournament && (
        <RegistrationModal
          tournament={selectedTournament}
          onClose={() => {
            setShowRegistrationModal(false);
            setSelectedTournament(null);
          }}
          onSuccess={() => {
            fetchTournaments();
            setShowRegistrationModal(false);
            setSelectedTournament(null);
          }}
        />
      )}
    </div>
  );
}

// Tournament Card Component
function TournamentCard({ 
  tournament, 
  countdown, 
  currentTime,
  onStatusChange,
  onRegistrationChange 
}: {
  tournament: Tournament;
  countdown: string;
  currentTime: Date;
  onStatusChange: () => void;
  onRegistrationChange: () => void;
}) {
  const needsGolfers = tournament.golfer_count === 0;
  const needsCompetitions = tournament.competition_count === 0;
  const hasIssues = needsGolfers || needsCompetitions;

  function getStatusColor(status: string): string {
    switch (status) {
      case 'upcoming': return '#6b7280';
      case 'registration_open': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#8b5cf6';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  function getStatusIcon(status: string): string {
    switch (status) {
      case 'upcoming': return '🔜';
      case 'registration_open': return '📝';
      case 'in_progress': return '⛳';
      case 'completed': return '🏆';
      case 'cancelled': return '❌';
      default: return '📌';
    }
  }

  function formatDate(dateString: string | null, timezone?: string, dateOnly: boolean = false): string {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    
    if (dateOnly) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      });
    }
    
    if (timezone) {
      try {
        return date.toLocaleString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: timezone
        }) + ` (${timezone.split('/')[1]?.replace('_', ' ') || timezone})`;
      } catch (e) {
        console.error(`Invalid timezone: ${timezone}`, e);
      }
    }
    
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getTimingText(): string {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (tournament.status === 'completed') return 'Finished';
    if (tournament.status === 'cancelled') return 'Cancelled';
    
    if (tournament.status === 'in_progress') {
      if (daysUntilEnd >= 0) return `In Progress (${daysUntilEnd}d left)`;
      return 'In Progress';
    }
    
    if (daysUntilStart > 0) return `${daysUntilStart}d away`;
    if (daysUntilStart === 0) return 'Starts Today';
    return 'Should be In Progress';
  }

  return (
    <div
      className={styles.card}
      style={{ borderLeft: `4px solid ${getStatusColor(tournament.status)}` }}
    >
      {/* Card Header */}
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.tournamentName}>
            {getStatusIcon(tournament.status)} {tournament.name}
          </div>
          <div className={styles.tournamentMeta}>
            <span>{tournament.timezone}</span>
            <span>•</span>
            <span>{getTimingText()}</span>
          </div>
        </div>
        <div
          className={styles.statusBadge}
          style={{ background: getStatusColor(tournament.status) }}
        >
          {tournament.status.replace('_', ' ')}
        </div>
      </div>

      {/* Live Countdown Timer */}
      {countdown && (
        <div 
          className={styles.countdown}
          style={{
            background: tournament.status === 'in_progress' ? 'rgba(59, 130, 246, 0.1)' :
                       tournament.status === 'registration_open' ? 'rgba(16, 185, 129, 0.1)' :
                       tournament.status === 'completed' ? 'rgba(139, 92, 246, 0.1)' :
                       tournament.status === 'cancelled' ? 'rgba(239, 68, 68, 0.1)' :
                       'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${tournament.status === 'in_progress' ? 'rgba(59, 130, 246, 0.3)' :
                                tournament.status === 'registration_open' ? 'rgba(16, 185, 129, 0.3)' :
                                tournament.status === 'completed' ? 'rgba(139, 92, 246, 0.3)' :
                                tournament.status === 'cancelled' ? 'rgba(239, 68, 68, 0.3)' :
                                'rgba(107, 114, 128, 0.3)'}`,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontWeight: 600,
            fontSize: '14px',
            textAlign: 'center',
            color: '#e5e7eb'
          }}
        >
          {countdown}
        </div>
      )}

      {/* Dual Timezone Clocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(17, 24, 39, 0.6)',
        borderRadius: '8px',
        border: '1px solid rgba(75, 85, 99, 0.3)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>YOUR TIME</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#e5e7eb', marginBottom: '2px' }}>
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>
            {Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace('_', ' ')}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>TOURNAMENT TIME</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#e5e7eb', marginBottom: '2px' }}>
            {currentTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              timeZone: tournament.timezone 
            })}
          </div>
          <div style={{ fontSize: '9px', color: '#6b7280' }}>
            {tournament.timezone.split('/').pop()?.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Tournament Dates */}
      <div className={styles.dates}>
        <div className={styles.dateItem}>
          <span className={styles.dateLabel}>🏌️ Tournament:</span>
          <span className={styles.dateValue}>
            {formatDate(tournament.start_date, tournament.timezone, true)} - {formatDate(tournament.end_date, tournament.timezone, true)}
          </span>
        </div>
        {tournament.registration_opens_at && (
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>📝 Reg Opens:</span>
            <span className={styles.dateValue}>{formatDate(tournament.registration_opens_at, tournament.timezone, false)}</span>
          </div>
        )}
        {tournament.registration_closes_at && (
          <div className={styles.dateItem}>
            <span className={styles.dateLabel}>🔒 Reg Closes:</span>
            <span className={styles.dateValue}>{formatDate(tournament.registration_closes_at, tournament.timezone, false)}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{tournament.golfer_count}</span>
          <span className={styles.statLabel}>Golfers</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{tournament.competition_count}</span>
          <span className={styles.statLabel}>Competitions</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{tournament.entry_count}</span>
          <span className={styles.statLabel}>Entries</span>
        </div>
      </div>

      {/* Issues Warning */}
      {hasIssues && (
        <div className={styles.warning}>
          <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }} />
          {needsGolfers && 'No golfers assigned'}
          {needsGolfers && needsCompetitions && ' • '}
          {needsCompetitions && 'No competitions created'}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={onStatusChange}
          className={styles.actionButton}
        >
          <i className="fas fa-exchange-alt" style={{ marginRight: '6px' }} />
          Change Status
        </button>
        <button
          onClick={onRegistrationChange}
          className={styles.actionButton}
        >
          <i className="fas fa-clock" style={{ marginRight: '6px' }} />
          Set Registration
        </button>
        <a
          href={`/tournaments/${tournament.id}/golfers`}
          className={styles.actionButton}
          style={{ 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}
        >
          <i className="fas fa-users-cog" style={{ marginRight: '6px' }} />
          Manage Golfers
        </a>
      </div>
      
      {/* Tertiary Actions */}
      <div style={{ marginTop: '8px' }}>
        <a
          href={`/tournaments/${tournament.id}`}
          className={styles.actionButton}
          style={{ 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '13px',
            width: '100%'
          }}
        >
          <i className="fas fa-cog" style={{ marginRight: '6px' }} />
          Tournament Settings
        </a>
      </div>
    </div>
  );
}

function StatusChangeModal({ tournament, onClose, onSuccess }: {
  tournament: Tournament;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newStatus, setNewStatus] = useState(tournament.status);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const statuses = [
    { value: 'upcoming', label: 'Upcoming', description: 'Tournament created, registration not yet open' },
    { value: 'registration_open', label: 'Registration Open', description: 'Users can register and build teams' },
    { value: 'in_progress', label: 'In Progress', description: 'Tournament has started, no new entries' },
    { value: 'completed', label: 'Completed', description: 'Tournament finished, results finalized' },
    { value: 'cancelled', label: 'Cancelled', description: 'Tournament cancelled, entries refunded' },
  ];

  async function handleSubmit() {
    if (newStatus === tournament.status) {
      onClose();
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`/api/tournament-lifecycle/${tournament.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Change Tournament Status</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.tournamentName}>{tournament.name}</p>
          <p className={styles.currentStatus}>
            Current: <strong>{tournament.status.replace('_', ' ')}</strong>
          </p>

          <div className={styles.statusOptions}>
            {statuses.map((status) => (
              <label
                key={status.value}
                className={`${styles.statusOption} ${newStatus === status.value ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={newStatus === status.value}
                  onChange={(e) => setNewStatus(e.target.value)}
                />
                <div>
                  <div className={styles.statusLabel}>{status.label}</div>
                  <div className={styles.statusDescription}>{status.description}</div>
                </div>
              </label>
            ))}
          </div>

          {error && (
            <div className={styles.error}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton} disabled={processing}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.submitButton} disabled={processing || newStatus === tournament.status}>
            {processing ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

function RegistrationModal({ tournament, onClose, onSuccess }: {
  tournament: Tournament;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [registrationOpens, setRegistrationOpens] = useState('');
  const [registrationCloses, setRegistrationCloses] = useState('');
  const [round1TeeTime, setRound1TeeTime] = useState('');
  const [round2TeeTime, setRound2TeeTime] = useState('');
  const [round3TeeTime, setRound3TeeTime] = useState('');
  const [round4TeeTime, setRound4TeeTime] = useState('');
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTeeTimesFromTournament();
  }, [tournament]);

  function loadTeeTimesFromTournament() {
    if (tournament.registration_opens_at) {
      const date = new Date(tournament.registration_opens_at);
      setRegistrationOpens(date.toISOString().slice(0, 16));
    }
    if (tournament.registration_closes_at) {
      const date = new Date(tournament.registration_closes_at);
      setRegistrationCloses(date.toISOString().slice(0, 16));
    }
    
    // Load existing tee times from tournament
    const tournamentData = tournament as any;
    if (tournamentData.round_1_start) {
      setRound1TeeTime(new Date(tournamentData.round_1_start).toISOString().slice(0, 16));
    } else {
      // Default to tournament start date at 06:20
      const r1 = new Date(tournament.start_date);
      r1.setHours(6, 20, 0, 0);
      setRound1TeeTime(r1.toISOString().slice(0, 16));
    }
    
    if (tournamentData.round_2_start) {
      setRound2TeeTime(new Date(tournamentData.round_2_start).toISOString().slice(0, 16));
    } else {
      const r2 = new Date(tournament.start_date);
      r2.setDate(r2.getDate() + 1);
      r2.setHours(6, 20, 0, 0);
      setRound2TeeTime(r2.toISOString().slice(0, 16));
    }
    
    if (tournamentData.round_3_start) {
      setRound3TeeTime(new Date(tournamentData.round_3_start).toISOString().slice(0, 16));
    } else {
      const r3 = new Date(tournament.start_date);
      r3.setDate(r3.getDate() + 2);
      r3.setHours(6, 20, 0, 0);
      setRound3TeeTime(r3.toISOString().slice(0, 16));
    }
    
    if (tournamentData.round_4_start) {
      setRound4TeeTime(new Date(tournamentData.round_4_start).toISOString().slice(0, 16));
    } else {
      const r4 = new Date(tournament.start_date);
      r4.setDate(r4.getDate() + 3);
      r4.setHours(6, 20, 0, 0);
      setRound4TeeTime(r4.toISOString().slice(0, 16));
    }
  }

  async function handleSyncFromDataGolf() {
    if (!confirm(`Sync tee times from DataGolf for ${tournament.name}?\n\nThis will fetch the latest tee times from DataGolf and populate the form.`)) return;
    
    setSyncing(true);
    setError('');
    
    try {
      // Determine tour from tournament name/location
      let tour = 'pga';
      const name = tournament.name.toLowerCase();
      if (name.includes('european') || name.includes('dp world') || name.includes('dunhill')) tour = 'euro';
      if (name.includes('lpga')) tour = 'lpga';
      if (name.includes('korn ferry')) tour = 'kft';
      
      const res = await fetch(`/api/tournaments/${tournament.id}/sync-golfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour, replace: false }),
      });
      
      if (res.ok) {
        const data = await res.json();
        // Reload tournament data to get updated tee times
        const tournamentRes = await fetch(`/api/tournaments/${tournament.id}`);
        if (tournamentRes.ok) {
          const updatedTournament = await tournamentRes.json();
          
          // Update form with new tee times
          if (updatedTournament.round_1_start) {
            setRound1TeeTime(new Date(updatedTournament.round_1_start).toISOString().slice(0, 16));
          }
          if (updatedTournament.round_2_start) {
            setRound2TeeTime(new Date(updatedTournament.round_2_start).toISOString().slice(0, 16));
          }
          if (updatedTournament.round_3_start) {
            setRound3TeeTime(new Date(updatedTournament.round_3_start).toISOString().slice(0, 16));
          }
          if (updatedTournament.round_4_start) {
            setRound4TeeTime(new Date(updatedTournament.round_4_start).toISOString().slice(0, 16));
          }
          
          alert(`✅ Successfully synced from DataGolf!\n\nGolfers added: ${data.golfersAdded || 0}\nTee times updated: Check the form below`);
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to sync from DataGolf');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync from DataGolf');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmit() {
    setProcessing(true);
    setError('');

    try {
      const res = await fetch(`/api/tournament-lifecycle/${tournament.id}/registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_opens_at: registrationOpens || null,
          registration_closes_at: registrationCloses || null,
          round_1_start: round1TeeTime || null,
          round_2_start: round2TeeTime || null,
          round_3_start: round3TeeTime || null,
          round_4_start: round4TeeTime || null,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update registration windows');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update registration windows');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Set Registration & Round Times</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              onClick={handleSyncFromDataGolf}
              disabled={syncing}
              style={{
                padding: '6px 12px',
                background: syncing ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                color: '#10b981',
                fontSize: '13px',
                fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
              {syncing ? 'Syncing...' : 'Sync from DataGolf'}
            </button>
            <button onClick={onClose} className={styles.closeButton}>×</button>
          </div>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.tournamentName}>{tournament.name}</p>
          <p className={styles.timezone}>Timezone: {tournament.timezone}</p>

          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: '#60a5fa' }}>
              Tournament Registration
            </h3>
            <div className={styles.formGroup}>
              <label htmlFor="reg-opens">Registration Opens At</label>
              <input
                id="reg-opens"
                type="datetime-local"
                value={registrationOpens}
                onChange={(e) => setRegistrationOpens(e.target.value)}
                className={styles.input}
              />
              <small>When users can start registering for this tournament</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="reg-closes">
                Registration Closes At
                <button
                  type="button"
                  onClick={() => {
                    if (round4TeeTime) {
                      const round4Date = new Date(round4TeeTime);
                      const closesDate = new Date(round4Date.getTime() - 15 * 60000);
                      setRegistrationCloses(closesDate.toISOString().slice(0, 16));
                    } else {
                      alert('Please set Round 4 Tee Time first');
                    }
                  }}
                  style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Auto-set to 15 minutes before Round 4 (latest competition)"
                >
                  Auto from R4
                </button>
              </label>
              <input
                id="reg-closes"
                type="datetime-local"
                value={registrationCloses}
                onChange={(e) => setRegistrationCloses(e.target.value)}
                className={styles.input}
              />
              <small>Latest time for any competition entry (auto: 15min before Round 4, or set manually)</small>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: '#10b981' }}>
              Round Tee Times (Competition Registration Closes 15 min before each)
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label htmlFor="round1">Round 1 Tee Time</label>
                <input
                  id="round1"
                  type="datetime-local"
                  value={round1TeeTime}
                  onChange={(e) => setRound1TeeTime(e.target.value)}
                  className={styles.input}
                />
                <small>Full Course, Beat The Cut, First To Strike</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="round2">Round 2 Tee Time</label>
                <input
                  id="round2"
                  type="datetime-local"
                  value={round2TeeTime}
                  onChange={(e) => setRound2TeeTime(e.target.value)}
                  className={styles.input}
                />
                <small>Second Round competition</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="round3">Round 3 Tee Time</label>
                <input
                  id="round3"
                  type="datetime-local"
                  value={round3TeeTime}
                  onChange={(e) => setRound3TeeTime(e.target.value)}
                  className={styles.input}
                />
                <small>THE WEEKENDER, Third Round</small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="round4">Round 4 Tee Time</label>
                <input
                  id="round4"
                  type="datetime-local"
                  value={round4TeeTime}
                  onChange={(e) => setRound4TeeTime(e.target.value)}
                  className={styles.input}
                />
                <small>Final Strike competition</small>
              </div>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }} />
              {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton} disabled={processing}>
            Cancel
          </button>
          <button onClick={handleSubmit} className={styles.submitButton} disabled={processing}>
            {processing ? 'Saving...' : 'Save & Calculate Competition Times'}
          </button>
        </div>
      </div>
    </div>
  );
}
