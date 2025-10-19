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

interface Competition {
  id: string;
  tournament_id: string;
  competition_type_id: string;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
  reg_open_at: string | null;
  reg_close_at: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string;
  competition_types: CompetitionType;
  tournaments: Tournament;
}

export default function EditCompetitionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [manualRegClose, setManualRegClose] = useState(false);
  const [showRegCloseWarning, setShowRegCloseWarning] = useState(false);

  const [formData, setFormData] = useState({
    entry_fee_pounds: '0.00',
    entrants_cap: '0',
    admin_fee_percent: '10.00',
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
        const data = await res.json();
        setCompetition(data);
        setFormData({
          entry_fee_pounds: (data.entry_fee_pennies / 100).toFixed(2),
          entrants_cap: data.entrants_cap.toString(),
          admin_fee_percent: data.admin_fee_percent.toString(),
          reg_open_at: data.reg_open_at ? data.reg_open_at.slice(0, 16) : '',
          reg_close_at: data.reg_close_at ? data.reg_close_at.slice(0, 16) : '',
          start_at: data.start_at ? data.start_at.slice(0, 16) : '',
          end_at: data.end_at ? data.end_at.slice(0, 16) : '',
          status: data.status,
        });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const entry_fee_pennies = Math.round(parseFloat(formData.entry_fee_pounds) * 100);

      const res = await fetch(`/api/competitions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_fee_pennies,
          entrants_cap: parseInt(formData.entrants_cap),
          admin_fee_percent: parseFloat(formData.admin_fee_percent),
          reg_open_at: formData.reg_open_at || null,
          reg_close_at: formData.reg_close_at || null,
          start_at: formData.start_at || null,
          end_at: formData.end_at || null,
          status: formData.status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update competition');
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

        {/* Prize Pool Calculator */}
        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
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
