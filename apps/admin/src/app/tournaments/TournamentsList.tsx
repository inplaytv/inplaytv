'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Tournament {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: string;
  start_date: string;
  end_date: string;
  updated_at: string;
  registration_open_date?: string;
  registration_close_date?: string;
}

interface TournamentsListProps {
  initialTournaments: Tournament[];
}

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; border: string; color: string; label: string }> = {
    draft: { bg: 'rgba(100, 100, 100, 0.2)', border: 'rgba(100, 100, 100, 0.4)', color: '#9ca3af', label: 'Draft' },
    upcoming: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa', label: 'Upcoming' },
    registration_open: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#10b981', label: 'Registration Open' },
    registration_closed: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', label: 'Registration Closed' },
    live_inplay: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171', label: 'Live In-Play' },
    completed: { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.4)', color: '#a78bfa', label: 'Completed' },
    cancelled: { bg: 'rgba(75, 85, 99, 0.2)', border: 'rgba(75, 85, 99, 0.4)', color: '#6b7280', label: 'Cancelled' },
    reg_open: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#10b981', label: 'Reg Open' },
    reg_closed: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', label: 'Reg Closed' },
    live: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171', label: 'Live' },
  };

  const style = styles[status] || styles.draft;

  return (
    <span style={{
      padding: '0.25rem 0.625rem',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: style.color,
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {style.label}
    </span>
  );
}

function formatDate(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TournamentsList({ initialTournaments }: TournamentsListProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>(initialTournaments);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [csvFile, setCSVFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [applyingStatus, setApplyingStatus] = useState<string | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set mounted state and initial timestamp on client side only
  useEffect(() => {
    setMounted(true);
    setLastUpdate(new Date());
  }, []);

  // Auto-refresh tournaments every 2 minutes to update statuses
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(async () => {
      try {
        // Trigger status update
        await fetch('/api/tournaments/update-statuses', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer default-cron-secret',
          },
        });

        // Refresh page data
        router.refresh();
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, router]);

  // Manual refresh
  const handleManualRefresh = async () => {
    setUpdating(true);
    try {
      const golfApiUrl = process.env.NEXT_PUBLIC_GOLF_URL || 'http://localhost:3001';
      const res = await fetch(`${golfApiUrl}/api/tournaments/auto-update-statuses`);
      const data = await res.json();
      
      if (res.ok) {
        console.log('Status update result:', data);
      }
      
      // Fetch suggestions after update
      await fetchSuggestions();
      
      router.refresh();
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Manual refresh error:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Fetch status mismatch suggestions
  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/tournaments/status-suggestions');
      const data = await res.json();
      
      if (res.ok) {
        setSuggestions(data.suggestions || []);
        if (data.suggestions && data.suggestions.length > 0) {
          setShowSuggestions(true);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Apply a suggested status change
  const applySuggestion = async (tournamentId: string, suggestedStatus: string) => {
    setApplyingStatus(tournamentId);
    try {
      const res = await fetch('/api/tournaments/status-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournamentId,
          suggested_status: suggestedStatus,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Remove this suggestion from the list
        setSuggestions(prev => prev.filter(s => s.tournament_id !== tournamentId));
        router.refresh();
      } else {
        console.error('Error applying suggestion:', data.error);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    } finally {
      setApplyingStatus(null);
    }
  };

  // Fetch suggestions on mount
  useEffect(() => {
    fetchSuggestions();
  }, []);

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCSVFile(file);
      setImportError('');
      setImportSuccess('');
    }
  };

  // Parse CSV and import tournaments
  const handleCSVImport = async () => {
    if (!csvFile) {
      setImportError('Please select a CSV file');
      return;
    }

    setImporting(true);
    setImportError('');
    setImportSuccess('');

    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter((line) => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must contain headers and at least one tournament');
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      
      // Required columns
      const requiredColumns = ['name', 'slug', 'start_date', 'end_date', 'registration_open_date', 'registration_close_date'];
      const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
      
      if (missingColumns.length > 0) {
        throw new Error('Missing required columns: ' + missingColumns.join(', '));
      }

      // Parse tournament rows
      const tournaments = lines.slice(1).map((line, index) => {
        const values = line.split(',').map((v) => v.trim());
        const tournament: any = {};
        
        headers.forEach((header, i) => {
          tournament[header] = values[i] || '';
        });

        return tournament;
      });

      // Import via API
      const res = await fetch('/api/tournaments/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournaments }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import tournaments');
      }

      setImportSuccess('Successfully imported ' + data.imported + ' tournament(s)!');
      setTimeout(() => setImportSuccess(''), 5000);
      
      // Reset form
      setCSVFile(null);
      setShowCSVImport(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh list
      router.refresh();
    } catch (error: any) {
      setImportError(error.message);
      setTimeout(() => setImportError(''), 5000);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (tournament: Tournament) => {
    const confirmMessage = 'Are you sure you want to delete "' + tournament.name + '"?\n\nThis will also delete:\n- All competitions in this tournament\n- All golfer groups\n- All entries\n\nThis action cannot be undone.';
    
    if (!confirm(confirmMessage)) {
      return;
    }

    setDeleting(tournament.id);

    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Failed to delete tournament');
        } catch (jsonErr) {
          console.error('Invalid JSON response from delete:', text);
          throw new Error('Server returned invalid response when deleting tournament');
        }
      }

      // Remove from list
      setTournaments(tournaments.filter(t => t.id !== tournament.id));
      
      // Optionally refresh the page
      router.refresh();
    } catch (error: any) {
      alert(`Error deleting tournament: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      {/* Control Panel */}
      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleManualRefresh}
            disabled={updating}
            style={{
              padding: '0.5rem 1rem',
              background: updating ? 'rgba(100,100,100,0.5)' : 'rgba(16, 185, 129, 0.9)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              cursor: updating ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: updating ? 0.6 : 1,
            }}
          >
            {updating ? '⏳ Updating...' : '🔄 Update Statuses Now'}
          </button>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={autoRefreshEnabled}
              onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Auto-refresh every 2 min
          </label>

          {mounted && lastUpdate && (
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>

        <button
          onClick={() => setShowCSVImport(!showCSVImport)}
          style={{
            padding: '0.5rem 1rem',
            background: showCSVImport ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.9)',
            border: showCSVImport ? '1px solid rgba(255,255,255,0.2)' : 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '0.875rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {showCSVImport ? 'Cancel Import' : '📤 Import CSV'}
        </button>
      </div>

      {/* Status Suggestions Panel */}
      {suggestions.length > 0 && showSuggestions && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ⚠️ Status Mismatch Suggestions
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                {suggestions.length} tournament{suggestions.length !== 1 ? 's' : ''} with date/status mismatch detected
              </p>
            </div>
            <button
              onClick={() => setShowSuggestions(false)}
              style={{
                padding: '0.5rem 1rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.875rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dismiss All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {suggestions.map((suggestion) => (
              <div 
                key={suggestion.tournament_id}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '6px',
                  padding: '1rem',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9375rem', color: '#fff' }}>
                      {suggestion.tournament_name}
                    </h4>
                    <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                      {suggestion.reason}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
                      <span>Start: {formatDate(suggestion.start_date)}</span>
                      <span>End: {formatDate(suggestion.end_date)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right', marginRight: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                        Current: <span style={{ color: '#f87171', fontWeight: 600 }}>{suggestion.current_status}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        Suggested: <span style={{ color: '#10b981', fontWeight: 600 }}>{suggestion.suggested_status}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => applySuggestion(suggestion.tournament_id, suggestion.suggested_status)}
                      disabled={applyingStatus === suggestion.tournament_id}
                      style={{
                        padding: '0.5rem 1rem',
                        background: applyingStatus === suggestion.tournament_id ? 'rgba(100,100,100,0.5)' : 'rgba(16, 185, 129, 0.9)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        cursor: applyingStatus === suggestion.tournament_id ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {applyingStatus === suggestion.tournament_id ? '...' : 'Apply'}
                    </button>
                    <button
                      onClick={() => setSuggestions(prev => prev.filter(s => s.tournament_id !== suggestion.tournament_id))}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        fontSize: '0.8125rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSV Import Panel */}
      {showCSVImport && (
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#fff' }}>
            Import Tournaments from CSV
          </h3>
          
          <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '6px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              CSV Format Requirements:
            </p>
            <p style={{ margin: '0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
              Required columns: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>name, slug, start_date, end_date, registration_open_date, registration_close_date</code><br/>
              Optional columns: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>description, location, timezone, status, image_url, external_id</code><br/>
              Date format: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>YYYY-MM-DD HH:MM:SS</code> or <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0.125rem 0.25rem', borderRadius: '3px' }}>YYYY-MM-DDTHH:MM:SSZ</code>
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: '#fff',
              width: '100%',
            }}
          />

          {importError && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#f87171',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              {importError}
            </div>
          )}

          {importSuccess && (
            <div style={{
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              color: '#10b981',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}>
              {importSuccess}
            </div>
          )}

          <button
            onClick={handleCSVImport}
            disabled={!csvFile || importing}
            style={{
              padding: '0.625rem 1.25rem',
              background: csvFile && !importing ? 'rgba(16, 185, 129, 0.9)' : 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              cursor: csvFile && !importing ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              opacity: csvFile && !importing ? 1 : 0.5,
            }}
          >
            {importing ? 'Importing...' : 'Import Tournaments'}
          </button>
        </div>
      )}

      {/* Tournaments Table */}
      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Title</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Location</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Start</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>End</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Updated</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
        <tbody>
          {tournaments.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                No tournaments yet. Create one to get started.
              </td>
            </tr>
          ) : (
            tournaments.map((tournament) => (
              <tr key={tournament.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                  {tournament.name}
                </td>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  {tournament.location || '—'}
                </td>
                <td style={{ padding: '0.875rem' }}>
                  {getStatusBadge(tournament.status)}
                </td>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  {formatDate(tournament.start_date)}
                </td>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                  {formatDate(tournament.end_date)}
                </td>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  {formatDate(tournament.updated_at)}
                </td>
                <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '4px',
                        color: '#60a5fa',
                        fontSize: '0.8rem',
                        textDecoration: 'none',
                        display: 'inline-block',
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tournament)}
                      disabled={deleting === tournament.id}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: deleting === tournament.id ? 'rgba(100, 100, 100, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${deleting === tournament.id ? 'rgba(100, 100, 100, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                        borderRadius: '4px',
                        color: deleting === tournament.id ? '#9ca3af' : '#f87171',
                        fontSize: '0.8rem',
                        cursor: deleting === tournament.id ? 'not-allowed' : 'pointer',
                        opacity: deleting === tournament.id ? 0.5 : 1,
                      }}
                    >
                      {deleting === tournament.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}
