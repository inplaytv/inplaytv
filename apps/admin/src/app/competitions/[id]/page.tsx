'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TIMEZONES } from '@/lib/timezones';

interface CompetitionType {
  id: string;
  name: string;
  slug: string;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
}

interface GolferGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  golfer_count?: number;
}

interface Competition {
  id: string;
  tournament_id: string;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  guaranteed_prize_pool_pennies: number | null;
  first_place_prize_pennies: number | null;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_types: CompetitionType;
  tournaments: Tournament;
}

// Updated: Added guaranteed prize pool fields
export default function EditCompetitionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [golferGroups, setGolferGroups] = useState<GolferGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [manualRegClose, setManualRegClose] = useState(false);
  const [showRegCloseWarning, setShowRegCloseWarning] = useState(false);

  const [formData, setFormData] = useState({
    entry_fee_pounds: '0.00',
    entrants_cap: '0',
    admin_fee_percent: '10.00',
    guaranteed_prize_pool_pounds: '',
    first_place_prize_pounds: '',
    reg_open_at: '',
    reg_close_at: '',
    start_at: '',
    end_at: '',
    status: 'draft',
  });

  // Auto-calculate reg_close_at when start_at changes
  useEffect(() => {
    if (formData.start_at && !manualRegClose) {
      const startDate = new Date(formData.start_at);
      const closeDate = new Date(startDate.getTime() - 15 * 60000); // 15 minutes before
      const closeString = closeDate.toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, reg_close_at: closeString }));
    }
  }, [formData.start_at, manualRegClose]);

  useEffect(() => {
    fetchCompetition();
  }, [params.id]);

  const fetchCompetition = async () => {
    try {
      const res = await fetch(`/api/competitions/${params.id}`);
      if (res.ok) {
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonError) {
          console.error('Invalid JSON response:', text);
          throw new Error('Server returned invalid JSON');
        }
        setCompetition(data);
        setFormData({
          entry_fee_pounds: (data.entry_fee_pennies / 100).toFixed(2),
          entrants_cap: data.entrants_cap.toString(),
          admin_fee_percent: data.admin_fee_percent.toString(),
          guaranteed_prize_pool_pounds: data.guaranteed_prize_pool_pennies 
            ? (data.guaranteed_prize_pool_pennies / 100).toFixed(2) 
            : '',
          first_place_prize_pounds: data.first_place_prize_pennies 
            ? (data.first_place_prize_pennies / 100).toFixed(2) 
            : '',
          reg_open_at: data.reg_open_at ? data.reg_open_at.slice(0, 16) : '',
          reg_close_at: data.reg_close_at ? data.reg_close_at.slice(0, 16) : '',
          start_at: data.start_at ? data.start_at.slice(0, 16) : '',
          end_at: data.end_at ? data.end_at.slice(0, 16) : '',
          status: data.status,
        });
        
        // Fetch golfer groups for this competition's tournament
        if (data.tournament_id) {
          fetchGolferGroups(data.tournament_id);
        }
      } else {
        setError('Failed to load competition');
      }
    } catch (err) {
      setError('Error loading competition');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGolferGroups = async (tournamentId: string) => {
    setLoadingGroups(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/golfer-groups`);
      if (res.ok) {
        const data = await res.json();
        setGolferGroups(data);
      }
    } catch (err) {
      console.error('Error loading golfer groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const entry_fee_pennies = Math.round(parseFloat(formData.entry_fee_pounds) * 100);
      const guaranteed_prize_pool_pennies = formData.guaranteed_prize_pool_pounds 
        ? Math.round(parseFloat(formData.guaranteed_prize_pool_pounds) * 100) 
        : null;
      const first_place_prize_pennies = formData.first_place_prize_pounds 
        ? Math.round(parseFloat(formData.first_place_prize_pounds) * 100) 
        : null;

      const res = await fetch(`/api/competitions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_fee_pennies,
          entrants_cap: parseInt(formData.entrants_cap),
          admin_fee_percent: parseFloat(formData.admin_fee_percent),
          guaranteed_prize_pool_pennies,
          first_place_prize_pennies,
          reg_open_at: formData.reg_open_at || null,
          reg_close_at: formData.reg_close_at || null,
          start_at: formData.start_at || null,
          end_at: formData.end_at || null,
          status: formData.status,
        }),
      });

      if (!res.ok) {
        // Try to parse error response
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || 'Failed to update competition');
        } catch (jsonErr) {
          console.error('Invalid JSON response from update:', text);
          throw new Error('Server returned invalid response when updating competition');
        }
      }
      
      // Parse successful response
      const text = await res.text();
      try {
        JSON.parse(text); // Validate JSON response
      } catch (jsonErr) {
        console.error('Invalid JSON success response:', text);
        throw new Error('Competition may have been updated, but server returned invalid response');
      }

      setSuccess('Competition updated successfully!');
      setTimeout(() => {
        router.push('/competitions');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this competition? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/competitions/${params.id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete competition');
      }

      router.push('/competitions');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!competition) {
    return <div style={{ padding: '2rem' }}>Competition not found</div>;
  }

  const calculatePrizePool = (entrants: number, entryFeePennies: number, adminFeePercent: number) => {
    const grossPennies = entrants * entryFeePennies;
    const adminFeePennies = Math.round(grossPennies * (adminFeePercent / 100));
    const netPrizePennies = grossPennies - adminFeePennies;
    return {
      gross: grossPennies,
      adminFee: adminFeePennies,
      netPrize: netPrizePennies,
    };
  };

  const formatPennies = (pennies: number) => {
    return `£${(pennies / 100).toFixed(2)}`;
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/competitions"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'inline-block',
            marginBottom: '1rem',
          }}
        >
          ← Back to Competitions
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Edit Competition
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
          {competition.competition_types.name} in {competition.tournaments.name}
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          padding: '0.875rem',
          marginBottom: '1.5rem',
          color: '#ef4444',
          fontSize: '0.875rem',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '6px',
          padding: '0.875rem',
          marginBottom: '1.5rem',
          color: '#10b981',
          fontSize: '0.875rem',
        }}>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Competition Details</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Entry Fee (£) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.entry_fee_pounds}
                onChange={(e) => setFormData({ ...formData, entry_fee_pounds: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Entrants Cap *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.entrants_cap}
                onChange={(e) => setFormData({ ...formData, entrants_cap: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="0 = unlimited"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Admin Fee % *
              </label>
              <input
                type="number"
                required
                min="0"
                max="100"
                step="0.01"
                value={formData.admin_fee_percent}
                onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                <span>Guaranteed Prize Pool (£)</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  (optional override)
                </span>
                {!formData.guaranteed_prize_pool_pounds && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    color: '#60a5fa',
                    fontWeight: '500'
                  }}>
                    🤖 AUTO
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.guaranteed_prize_pool_pounds}
                onChange={(e) => setFormData({ ...formData, guaranteed_prize_pool_pounds: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: !formData.guaranteed_prize_pool_pounds 
                    ? '1px solid rgba(59, 130, 246, 0.4)' 
                    : '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder={(() => {
                  const entrants = parseInt(formData.entrants_cap) || 0;
                  const entryFee = parseFloat(formData.entry_fee_pounds) || 0;
                  const adminFee = parseFloat(formData.admin_fee_percent) || 10;
                  if (entrants > 0 && entryFee > 0) {
                    const gross = entrants * entryFee;
                    const fee = gross * (adminFee / 100);
                    const net = gross - fee;
                    return `Auto: £${net.toFixed(2)}`;
                  }
                  return 'Auto-calculated if empty';
                })()}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                <span>First Place Prize (£)</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                  (optional override)
                </span>
                {!formData.first_place_prize_pounds && (
                  <span style={{
                    marginLeft: '0.5rem',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    color: '#60a5fa',
                    fontWeight: '500'
                  }}>
                    🤖 AUTO
                  </span>
                )}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.first_place_prize_pounds}
                onChange={(e) => setFormData({ ...formData, first_place_prize_pounds: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: !formData.first_place_prize_pounds 
                    ? '1px solid rgba(59, 130, 246, 0.4)' 
                    : '1px solid rgba(16, 185, 129, 0.4)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder={(() => {
                  const entrants = parseInt(formData.entrants_cap) || 0;
                  const entryFee = parseFloat(formData.entry_fee_pounds) || 0;
                  const adminFee = parseFloat(formData.admin_fee_percent) || 10;
                  if (entrants > 0 && entryFee > 0) {
                    const gross = entrants * entryFee;
                    const fee = gross * (adminFee / 100);
                    const net = gross - fee;
                    const firstPlace = net * 0.25;
                    return `Auto: £${firstPlace.toFixed(2)}`;
                  }
                  return 'Auto-calculated if empty';
                })()}
              />
            </div>
          </div>          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: '0.5rem 0 0 0' }}>
            💡 Leave these empty to auto-calculate based on entry fee, cap, and admin fee. Set custom values to override.
          </p>
        </div>

        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Status</h3>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Competition Status
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                (manual override)
              </span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="reg_open">Registration Open</option>
              <option value="reg_closed">Registration Closed</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
              ⚠️ Auto-updates to "Registration Open" 6 days before tournament start
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Registration & Timing</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Registration Opens
              </label>
              <input
                type="datetime-local"
                value={formData.reg_open_at}
                onChange={(e) => setFormData({ ...formData, reg_open_at: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Registration Closes
                {!manualRegClose && formData.start_at && (
                  <span style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                    (auto: 15 mins before start)
                  </span>
                )}
              </label>
              <input
                type="datetime-local"
                value={formData.reg_close_at}
                onChange={(e) => {
                  setManualRegClose(true);
                  setShowRegCloseWarning(true);
                  setFormData({ ...formData, reg_close_at: e.target.value });
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
              {showRegCloseWarning && (
                <p style={{ fontSize: '0.75rem', color: 'rgba(251, 191, 36, 0.9)', marginTop: '0.25rem' }}>
                  ⚠️ Manual override active. Auto-calculation disabled.
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                value={formData.start_at}
                onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                End Time
              </label>
              <input
                type="datetime-local"
                value={formData.end_at}
                onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
              }}
            >
              <option value="draft">Draft</option>
              <option value="upcoming">Upcoming</option>
              <option value="reg_open">Registration Open</option>
              <option value="reg_closed">Registration Closed</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Golfer Groups (Read-only) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
              Golfer Groups
            </h3>
            {competition && (
              <Link
                href={`/tournaments/${competition.tournament_id}`}
                style={{
                  fontSize: '0.8125rem',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                Edit in Tournament →
              </Link>
            )}
          </div>

          {loadingGroups ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              Loading golfer groups...
            </div>
          ) : golferGroups.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.875rem',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#ef4444' }}>
                ⚠️ No golfer groups assigned
              </div>
              <div>
                This tournament doesn't have any golfer groups assigned yet.{' '}
                {competition && (
                  <Link
                    href={`/tournaments/${competition.tournament_id}`}
                    style={{ color: '#60a5fa', textDecoration: 'underline' }}
                  >
                    Go to tournament page
                  </Link>
                )}
                {' '}to assign golfer groups.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {golferGroups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    background: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '40px',
                      borderRadius: '4px',
                      background: group.color || '#6366f1',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.25rem', color: '#fff' }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)' }}>
                      {group.golfer_count ? `${group.golfer_count} golfer${group.golfer_count !== 1 ? 's' : ''}` : 'No golfers'}
                      {group.description && ` • ${group.description}`}
                    </div>
                  </div>
                  <div style={{
                    padding: '0.375rem 0.75rem',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '6px',
                    color: '#22c55e',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}>
                    ACTIVE
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: 'rgba(255,255,255,0.7)',
          }}>
            <strong>Note:</strong> Golfer groups are managed at the tournament level. All competitions within the same tournament share the same golfer pool.
          </div>
        </div>

        {/* Prize Pool Calculator */}
        <div style={{
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
            Prize Pool Calculator
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {[50, 100, 200].map((entrants) => {
              const { gross, adminFee, netPrize } = calculatePrizePool(
                entrants,
                Math.round(parseFloat(formData.entry_fee_pounds) * 100),
                parseFloat(formData.admin_fee_percent)
              );
              return (
                <div key={entrants} style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '0.875rem',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgba(255,255,255,0.9)' }}>
                    {entrants} Entrants
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
                    Gross: {formatPennies(gross)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(239, 68, 68, 0.8)', marginBottom: '0.25rem' }}>
                    Admin ({formData.admin_fee_percent}%): -{formatPennies(adminFee)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'rgba(16, 185, 129, 0.9)', fontWeight: 600, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                    Prize Pool: {formatPennies(netPrize)}
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem' }}>
            * These are example calculations. Actual prize pools depend on real entrant numbers.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '6px',
              color: '#ef4444',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
            }}
          >
            Delete Competition
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link
              href="/competitions"
              style={{
                padding: '0.625rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.9375rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '0.625rem 1.25rem',
                background: saving ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.9375rem',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
