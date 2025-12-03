'use client';

import { useState, useEffect } from 'react';
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTournaments();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTournaments, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchTournaments() {
    try {
      const res = await fetch('/api/tournament-lifecycle');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments);
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
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
    
    // If timezone is provided, format in that timezone
    if (timezone) {
      try {
        if (dateOnly) {
          // For date-only display (tournament dates)
          return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            timeZone: timezone
          });
        } else {
          // For datetime display (registration windows)
          return date.toLocaleString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: timezone
          }) + ` (${timezone.split('/')[1]?.replace('_', ' ') || timezone})`;
        }
      } catch (e) {
        console.error(`Invalid timezone: ${timezone}`, e);
        // Fallback to default formatting
      }
    }
    
    // Default formatting
    if (dateOnly) {
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
    
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
        <div className={styles.grid}>
          {tournaments.map((tournament) => {
            const needsGolfers = tournament.golfer_count === 0;
            const needsCompetitions = tournament.competition_count === 0;
            const hasIssues = needsGolfers || needsCompetitions;

            return (
              <div
                key={tournament.id}
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
                      <span>{getTimingText(tournament)}</span>
                    </div>
                  </div>
                  <div
                    className={styles.statusBadge}
                    style={{ background: getStatusColor(tournament.status) }}
                  >
                    {tournament.status.replace('_', ' ')}
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
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setShowStatusModal(true);
                    }}
                    className={styles.actionButton}
                  >
                    <i className="fas fa-exchange-alt" style={{ marginRight: '6px' }} />
                    Change Status
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setShowRegistrationModal(true);
                    }}
                    className={styles.actionButton}
                  >
                    <i className="fas fa-clock" style={{ marginRight: '6px' }} />
                    Set Registration
                  </button>
                </div>
              </div>
            );
          })}
        </div>
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
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tournament.registration_opens_at) {
      const date = new Date(tournament.registration_opens_at);
      setRegistrationOpens(date.toISOString().slice(0, 16));
    }
    if (tournament.registration_closes_at) {
      const date = new Date(tournament.registration_closes_at);
      setRegistrationCloses(date.toISOString().slice(0, 16));
    }
  }, [tournament]);

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
          <h2>Set Registration Windows</h2>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.tournamentName}>{tournament.name}</p>
          <p className={styles.timezone}>Timezone: {tournament.timezone}</p>

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
            <label htmlFor="reg-closes">Registration Closes At</label>
            <input
              id="reg-closes"
              type="datetime-local"
              value={registrationCloses}
              onChange={(e) => setRegistrationCloses(e.target.value)}
              className={styles.input}
            />
            <small>When registration closes (typically before tournament starts)</small>
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
            {processing ? 'Saving...' : 'Save Registration Windows'}
          </button>
        </div>
      </div>
    </div>
  );
}
