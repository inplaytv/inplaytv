'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface RoundScore {
  id: string;
  golfer_id: string;
  golfer_name: string;
  golfer_first_name: string;
  golfer_last_name: string;
  round_number: number;
  score: number | null;
  to_par: number | null;
  status: string;
  holes_completed: number;
  data_source: string;
  is_manual_override: boolean;
  updated_at: string;
  notes: string | null;
  position?: string;
}

interface SyncStatus {
  last_sync: string | null;
  sync_count: number;
  last_error: string | null;
}

export default function TournamentScoringPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [roundScores, setRoundScores] = useState<RoundScore[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ score: '', notes: '' });

  useEffect(() => {
    loadTournament();
    loadSyncStatus();
  }, [tournamentId]);

  useEffect(() => {
    if (tournament) {
      loadRoundScores();
    }
  }, [tournament, selectedRound]);

  const loadTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) throw new Error('Failed to load tournament');
      const data = await res.json();
      setTournament(data);
      
      // Auto-select current round based on dates
      const now = new Date();
      const start = new Date(data.start_date);
      const daysPassed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const currentRound = Math.min(Math.max(daysPassed + 1, 1), 4);
      setSelectedRound(currentRound);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRoundScores = async () => {
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/scores?round=${selectedRound}`);
      if (!res.ok) throw new Error('Failed to load scores');
      const data = await res.json();
      setRoundScores(data.scores || []);
    } catch (err: any) {
      console.error('Error loading scores:', err);
      setRoundScores([]);
    }
  };

  const loadSyncStatus = async () => {
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/sync-scores`);
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (err) {
      console.error('Error loading sync status:', err);
    }
  };

  const handleSyncScores = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/sync-scores`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Sync failed');
      }
      
      const data = await res.json();
      setSuccess(`Synced ${data.updated} scores from DataGolf`);
      
      // Reload scores and status
      await loadRoundScores();
      await loadSyncStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleInitializeScores = async () => {
    setSyncing(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/scores/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: selectedRound })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to initialize scores');
      }
      
      const data = await res.json();
      setSuccess(`Initialized ${data.count} score entries for manual entry`);
      
      // Reload scores
      await loadRoundScores();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const startEdit = (scoreId: string, currentScore: number | null, currentNotes: string | null) => {
    setEditingScore(scoreId);
    setEditForm({
      score: currentScore?.toString() || '',
      notes: currentNotes || ''
    });
  };

  const cancelEdit = () => {
    setEditingScore(null);
    setEditForm({ score: '', notes: '' });
  };

  const saveEdit = async (scoreId: string) => {
    try {
      const res = await fetch(`/api/admin/tournaments/${tournamentId}/scores/${scoreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(editForm.score),
          notes: editForm.notes
        })
      });

      if (!res.ok) throw new Error('Failed to update score');
      
      setSuccess('Score updated successfully');
      setEditingScore(null);
      await loadRoundScores();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (score: RoundScore) => {
    if (score.is_manual_override) {
      return <span className="status-badge manual">✏️ Manual</span>;
    }
    
    switch (score.status) {
      case 'completed':
        return <span className="status-badge completed">✅ Complete</span>;
      case 'in_progress':
        return <span className="status-badge in-progress">🟡 In Progress ({score.holes_completed}/18)</span>;
      case 'withdrawn':
        return <span className="status-badge withdrawn">❌ WD</span>;
      case 'cut':
        return <span className="status-badge cut">✂️ Cut</span>;
      default:
        return <span className="status-badge not-started">⏸️ Not Started</span>;
    }
  };

  const formatScore = (score: number | null, toPar: number | null) => {
    if (score === null) return '-';
    
    let parDisplay = '';
    if (toPar !== null) {
      if (toPar === 0) parDisplay = 'E';
      else if (toPar > 0) parDisplay = `+${toPar}`;
      else parDisplay = `${toPar}`;
    }
    
    return `${score}${parDisplay ? ` (${parDisplay})` : ''}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading tournament scoring...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container">
        <div className="error">Tournament not found</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div>
          <Link href="/tournaments" className="breadcrumb">← Tournaments</Link>
          <h1>{tournament.name} - Scoring Dashboard</h1>
          <p className="subtitle">Manage round scores and sync with DataGolf</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Sync Status Bar */}
      <div className="sync-status-bar">
        <div className="sync-info">
          {syncStatus?.last_sync ? (
            <>
              <span className="sync-label">Last Sync:</span>
              <span className="sync-time">{formatTimestamp(syncStatus.last_sync)}</span>
              <span className="sync-count">({syncStatus.sync_count} total syncs)</span>
            </>
          ) : (
            <span className="sync-label">No syncs yet</span>
          )}
        </div>
        <button 
          onClick={handleSyncScores} 
          disabled={syncing}
          className="btn-sync"
        >
          {syncing ? '🔄 Syncing...' : '🔄 Sync Scores Now'}
        </button>
      </div>

      {/* Round Selector */}
      <div className="round-selector">
        {[1, 2, 3, 4].map(round => (
          <button
            key={round}
            onClick={() => setSelectedRound(round)}
            className={`round-btn ${selectedRound === round ? 'active' : ''}`}
          >
            Round {round}
          </button>
        ))}
      </div>

      {/* Scores Table */}
      <div className="card">
        <div className="card-header">
          <h2>Round {selectedRound} Scores</h2>
          <span className="golfer-count">{roundScores.length} golfers</span>
        </div>
        
        {roundScores.length === 0 ? (
          <div className="empty-state">
            <p>No scores available for Round {selectedRound} yet.</p>
            {tournament?.status === 'completed' ? (
              <>
                <p className="help-text">
                  This tournament is completed. DataGolf sync only works for active tournaments.
                </p>
                <button 
                  onClick={handleInitializeScores}
                  disabled={syncing}
                  className="btn-initialize"
                >
                  {syncing ? 'Initializing...' : '📝 Initialize Scores for Manual Entry'}
                </button>
                <p className="help-text-small">
                  This will create blank score entries for all golfers, which you can then edit manually.
                </p>
              </>
            ) : (
              <p>Click "Sync Scores Now" to fetch from DataGolf.</p>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="scores-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roundScores.map((score, idx) => (
                  <>
                    <tr key={score.id} className={score.is_manual_override ? 'manual-row' : ''}>
                      <td>{score.position || idx + 1}</td>
                      <td className="player-name">
                        {score.golfer_name || `${score.golfer_first_name} ${score.golfer_last_name}`}
                      </td>
                      <td className="score-cell">
                        {editingScore === score.id ? (
                          <input
                            type="number"
                            value={editForm.score}
                            onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
                            className="score-input"
                            placeholder="Score"
                          />
                        ) : (
                          <span className="score-value">{formatScore(score.score, score.to_par)}</span>
                        )}
                      </td>
                      <td>{getStatusBadge(score)}</td>
                      <td className="source-cell">
                        <span className={`source-badge ${score.data_source}`}>
                          {score.data_source}
                        </span>
                      </td>
                      <td className="timestamp">{formatTimestamp(score.updated_at)}</td>
                      <td className="actions-cell">
                        {editingScore === score.id ? (
                          <div className="edit-actions">
                            <button onClick={() => saveEdit(score.id)} className="btn-save">
                              Save
                            </button>
                            <button onClick={cancelEdit} className="btn-cancel">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEdit(score.id, score.score, score.notes)}
                            className="btn-edit"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                    {editingScore === score.id && (
                      <tr className="notes-row">
                        <td colSpan={7}>
                          <div className="notes-editor">
                            <label>Notes (reason for manual override):</label>
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              placeholder="e.g., DataGolf had incorrect score, verified with official leaderboard"
                              rows={2}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .header {
          margin-bottom: 24px;
        }

        .breadcrumb {
          color: #6b7280;
          text-decoration: none;
          font-size: 14px;
          margin-bottom: 8px;
          display: inline-block;
        }

        .breadcrumb:hover {
          color: #374151;
        }

        h1 {
          font-size: 28px;
          font-weight: 700;
          color: #111827;
          margin: 8px 0;
        }

        .subtitle {
          color: #6b7280;
          font-size: 14px;
        }

        .alert {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #166534;
        }

        .alert button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 0 8px;
          color: inherit;
        }

        .sync-status-bar {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .sync-info {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .sync-label {
          font-weight: 600;
          color: #374151;
        }

        .sync-time {
          color: #6b7280;
        }

        .sync-count {
          color: #9ca3af;
          font-size: 14px;
        }

        .btn-sync {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-sync:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-sync:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .round-selector {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .round-btn {
          flex: 1;
          padding: 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .round-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .round-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .card-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h2 {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .golfer-count {
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state {
          padding: 48px;
          text-align: center;
          color: #6b7280;
        }

        .empty-state p {
          margin: 8px 0;
        }

        .btn-initialize {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
          margin: 16px 0;
        }

        .btn-initialize:hover:not(:disabled) {
          background: #059669;
        }

        .btn-initialize:disabled {
          background: #6ee7b7;
          cursor: not-allowed;
        }

        .help-text {
          color: #9ca3af;
          font-size: 14px;
          margin: 12px 0;
        }

        .help-text-small {
          color: #9ca3af;
          font-size: 12px;
          font-style: italic;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .scores-table {
          width: 100%;
          border-collapse: collapse;
        }

        .scores-table th {
          background: #f9fafb;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        .scores-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }

        .scores-table tr:hover {
          background: #f9fafb;
        }

        .manual-row {
          background: #fffbeb !important;
        }

        .player-name {
          font-weight: 600;
          color: #111827;
        }

        .score-cell {
          font-size: 16px;
          font-weight: 700;
        }

        .score-input {
          width: 80px;
          padding: 4px 8px;
          border: 2px solid #3b82f6;
          border-radius: 4px;
          font-size: 14px;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .status-badge.manual {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.in-progress {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.withdrawn {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.cut {
          background: #e5e7eb;
          color: #374151;
        }

        .status-badge.not-started {
          background: #f3f4f6;
          color: #6b7280;
        }

        .source-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .source-badge.datagolf {
          background: #dbeafe;
          color: #1e40af;
        }

        .source-badge.manual {
          background: #fef3c7;
          color: #92400e;
        }

        .timestamp {
          color: #6b7280;
          font-size: 13px;
        }

        .actions-cell {
          text-align: right;
        }

        .btn-edit {
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-edit:hover {
          background: #e5e7eb;
        }

        .edit-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-save {
          background: #10b981;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-save:hover {
          background: #059669;
        }

        .btn-cancel {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-cancel:hover {
          background: #dc2626;
        }

        .notes-row {
          background: #fffbeb;
        }

        .notes-editor {
          padding: 12px;
        }

        .notes-editor label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .notes-editor textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
        }

        .notes-editor textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .loading, .error {
          text-align: center;
          padding: 48px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
