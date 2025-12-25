'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Competition {
  id: string;
  tournament_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  created_at: string;
  tournaments: {
    id: string;
    name: string;
    location: string | null;
  };
  competition_types: {
    id: string;
    name: string;
  };
}

function getStatusBadge(status: string) {
  const styles: Record<string, { bg: string; border: string; color: string }> = {
    draft: { bg: 'rgba(100, 100, 100, 0.2)', border: 'rgba(100, 100, 100, 0.4)', color: '#9ca3af' },
    upcoming: { bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa' },
    reg_open: { bg: 'rgba(16, 185, 129, 0.2)', border: 'rgba(16, 185, 129, 0.4)', color: '#10b981' },
    reg_closed: { bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' },
    live: { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.4)', color: '#f87171' },
    completed: { bg: 'rgba(139, 92, 246, 0.2)', border: 'rgba(139, 92, 246, 0.4)', color: '#a78bfa' },
    cancelled: { bg: 'rgba(75, 85, 99, 0.2)', border: 'rgba(75, 85, 99, 0.4)', color: '#6b7280' },
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
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPennies(pennies: number) {
  return `£${(pennies / 100).toFixed(2)}`;
}

function calculatePrizePool(entrants: number, entryFeePennies: number, adminFeePercent: number) {
  const gross = entrants * entryFeePennies;
  const adminFee = Math.round(gross * (adminFeePercent / 100));
  const netPrize = gross - adminFee;
  return { gross, adminFee, netPrize };
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [customEntrants, setCustomEntrants] = useState<{ [key: string]: string }>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = () => {
    if (selectedIds.size === competitions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(competitions.map(c => c.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.size} competition(s)?\n\n` +
      `This will permanently remove:\n` +
      `- Competition entries\n` +
      `- Competition picks\n` +
      `- Related data\n\n` +
      `This action CANNOT be undone!`
    );
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch('/api/competitions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionIds: Array.from(selectedIds) }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Successfully deleted ${result.deleted} competition(s)`);
        
        // Force immediate UI update - remove deleted items from state
        setCompetitions(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        
        // Also force a fresh fetch from server to ensure sync
        setTimeout(async () => {
          const timestamp = Date.now();
          const res = await fetch(`/api/competitions?_=${timestamp}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (res.ok) {
            const data = await res.json();
            setCompetitions(data);
          }
        }, 100);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to delete competitions'}`);
      }
    } catch (err) {
      console.error('Error deleting competitions:', err);
      alert('Failed to delete competitions. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchCompetitions() {
      try {
        // Add cache busting timestamp to force fresh data
        const timestamp = Date.now();
        const res = await fetch(`/api/competitions?_=${timestamp}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (res.ok) {
          const data = await res.json();
          setCompetitions(data);
        }
      } catch (err) {
        console.error('Error fetching competitions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCompetitions();
  }, []);

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Active Competitions</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
            Competitions that are linked to tournaments and available for entrants to join
          </p>
        </div>
        
        {selectedIds.size > 0 && (
          <button
            onClick={handleBulkDelete}
            disabled={isDeleting}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '2px solid rgba(239, 68, 68, 0.6)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.5 : 1,
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
            onMouseOver={(e) => {
              if (!isDeleting) {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.8)';
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            }}
          >
            {isDeleting ? (
              <>
                <span className="spinner">⏳</span>
                Deleting...
              </>
            ) : (
              <>
                🗑️ Delete {selectedIds.size} Competition{selectedIds.size > 1 ? 's' : ''}
              </>
            )}
          </button>
        )}
      </div>

      <div style={{
        background: 'rgba(30, 30, 35, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0, 0, 0, 0.2)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.size === competitions.length && competitions.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#10b981',
                  }}
                />
              </th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Tournament</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Competition Type</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Entry Fee</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Cap</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reg Opens</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reg Closes</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {competitions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
                  No active competitions yet. Create tournaments and add competition types to them.
                </td>
              </tr>
            ) : (
              competitions.map((comp) => (
                <tr 
                  key={comp.id} 
                  style={{ 
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    background: selectedIds.has(comp.id) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(comp.id)}
                      onChange={() => handleSelectOne(comp.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#ef4444',
                      }}
                    />
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: '0.25rem' }}>
                      {comp.tournaments.name}
                    </div>
                    {comp.tournaments.location && (
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem' }}>
                        {comp.tournaments.location}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>
                    {comp.competition_types.name}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {formatPennies(comp.entry_fee_pennies)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                    {comp.entrants_cap === 0 ? 'Unlimited' : comp.entrants_cap.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.875rem' }}>
                    {getStatusBadge(comp.status)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
                    {formatDateTime(comp.reg_open_at)}
                  </td>
                  <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8125rem' }}>
                    {formatDateTime(comp.reg_close_at)}
                  </td>
                  <td style={{ padding: '0.875rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/competitions/${comp.id}`}
                        style={{
                          padding: '0.375rem 0.75rem',
                          background: 'rgba(16, 185, 129, 0.2)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          borderRadius: '4px',
                          color: '#10b981',
                          fontSize: '0.8rem',
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/tournaments/${comp.tournament_id}`}
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
                        View Tournament
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Prize Pool Calculator */}
      {competitions.some(c => c.entry_fee_pennies > 0) && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          marginTop: '2rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Prize Pool Calculator</h2>
          
          {competitions.filter(c => c.entry_fee_pennies > 0).map((comp) => {
            const entrantsCap = comp.entrants_cap || 0;
            const scenarios = entrantsCap > 0 
              ? [
                  Math.ceil(entrantsCap * 0.25), // 25% filled
                  Math.ceil(entrantsCap * 0.5),  // 50% filled
                  entrantsCap                     // 100% filled
                ]
              : [50, 100, 200]; // Default scenarios if no cap set
            
            return (
              <div key={comp.id} style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: '#60a5fa' }}>
                  {comp.tournaments.name} - {comp.competition_types.name} — {formatPennies(comp.entry_fee_pennies)} entry
                  {entrantsCap > 0 && ` • Max: ${entrantsCap} entrants`}
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  {scenarios.map((entrants) => {
                    const { gross, adminFee, netPrize } = calculatePrizePool(
                      entrants,
                      comp.entry_fee_pennies,
                      comp.admin_fee_percent
                    );
                    const percentage = entrantsCap > 0 ? Math.round((entrants / entrantsCap) * 100) : 0;
                    
                    return (
                      <div key={entrants} style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        padding: '0.875rem',
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
                          {entrants} Entrants {entrantsCap > 0 && `(${percentage}%)`}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                          Gross: {formatPennies(gross)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'rgba(239, 68, 68, 0.8)', marginBottom: '0.25rem' }}>
                          Admin ({comp.admin_fee_percent}%): -{formatPennies(adminFee)}
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'rgba(16, 185, 129, 0.9)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                          Prize Pool: {formatPennies(netPrize)}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Custom Entrants Calculator */}
                  {(() => {
                    const customValue = customEntrants[comp.id] || '0';
                    const entrants = parseInt(customValue) || 0;
                    const { gross, adminFee, netPrize } = calculatePrizePool(
                      entrants,
                      comp.entry_fee_pennies,
                      comp.admin_fee_percent
                    );
                    const percentage = entrantsCap > 0 && entrants > 0 ? Math.round((entrants / entrantsCap) * 100) : 0;
                    
                    return (
                      <div style={{
                        background: 'rgba(96, 165, 250, 0.15)',
                        border: '1px solid rgba(96, 165, 250, 0.3)',
                        borderRadius: '6px',
                        padding: '0.875rem',
                      }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#60a5fa' }}>
                          Custom Amount
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={customValue}
                          onChange={(e) => setCustomEntrants(prev => ({ ...prev, [comp.id]: e.target.value }))}
                          placeholder="Enter entrants"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.875rem',
                            marginBottom: '0.5rem',
                          }}
                        />
                        {entrants > 0 && (
                          <>
                            <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                              Gross: {formatPennies(gross)}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'rgba(239, 68, 68, 0.8)', marginBottom: '0.25rem' }}>
                              Admin ({comp.admin_fee_percent}%): -{formatPennies(adminFee)}
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'rgba(16, 185, 129, 0.9)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                              Prize Pool: {formatPennies(netPrize)}
                            </div>
                            {percentage > 0 && (
                              <div style={{ fontSize: '0.75rem', color: 'rgba(96, 165, 250, 0.8)', marginTop: '0.25rem' }}>
                                {percentage}% of capacity
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
          
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
            * These are example calculations. Actual prize pools depend on real entrant numbers.
          </p>
        </div>
      )}
    </div>
  );
}
