'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TIMEZONES, DEFAULT_TIMEZONE } from '@/lib/timezones';

interface DefaultCompetition {
  competition_type_id: string;
  name: string;
  enabled: boolean;
  entry_fee_pennies: number;
  entrants_cap: number;
  admin_fee_percent: number;
}

export default function NewTournamentPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    timezone: DEFAULT_TIMEZONE,
    start_date: '',
    end_date: '',
    status: 'draft',
    external_id: '',
    image_url: '',
    auto_manage_timing: true, // Auto-calculate registration times
  });
  const [autoCreateComps, setAutoCreateComps] = useState(true);
  const [defaultCompetitions, setDefaultCompetitions] = useState<DefaultCompetition[]>([]);

  // Fetch competition types on mount
  useEffect(() => {
    fetchCompetitionTypes();
  }, []);

  const fetchCompetitionTypes = async () => {
    try {
      const res = await fetch('/api/competition-types');
      if (res.ok) {
        const data = await res.json();
        // Get first 6 main competitions (Full Course, Beat The Cut, The Weekender, Round 1-3)
        const mainComps = data.competitionTypes?.filter((ct: any) => 
          ['full-course', 'beat-the-cut', 'the-weekender', 'round-1', 'round-2', 'round-3'].includes(ct.slug)
        ).slice(0, 6);
        
        if (mainComps) {
          setDefaultCompetitions(mainComps.map((ct: any) => ({
            competition_type_id: ct.id,
            name: ct.name,
            enabled: true,
            entry_fee_pennies: ct.default_entry_fee_pennies || 1000, // £10 default
            entrants_cap: ct.default_entrants_cap || 10,
            admin_fee_percent: ct.default_admin_fee_percent || 10,
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch competition types:', err);
    }
  };

  const updateCompetition = (index: number, field: keyof DefaultCompetition, value: any) => {
    setDefaultCompetitions(prev => prev.map((comp, i) => 
      i === index ? { ...comp, [field]: value } : comp
    ));
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  // Calculate registration close time: start_date - 15 minutes
  const getComputedRegClose = () => {
    if (!formData.start_date) return null;
    const startDate = new Date(formData.start_date);
    const regClose = new Date(startDate.getTime() - 15 * 60 * 1000); // -15 mins
    return regClose.toISOString().slice(0, 16); // Format for datetime-local
  };

  // Calculate registration open time: start_date - 7 days
  const getComputedRegOpen = () => {
    if (!formData.start_date) return null;
    const startDate = new Date(formData.start_date);
    const regOpen = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000); // -7 days
    return regOpen.toISOString().slice(0, 16);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Validate dates
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        if (end < start) {
          setError('End date must be after start date');
          setSaving(false);
          return;
        }
      }

      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          autoCreateCompetitions: autoCreateComps,
          defaultCompetitions: autoCreateComps ? defaultCompetitions.filter(c => c.enabled) : [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/tournaments/${data.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create tournament');
        setSaving(false);
      }
    } catch (err) {
      setError('Network error');
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <Link
          href="/tournaments"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '0.875rem',
            display: 'inline-block',
            marginBottom: '1rem',
          }}
        >
          ← Back to Tournaments
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Create Tournament</h1>
      </div>

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#f87171',
          marginBottom: '1.5rem',
        }}>
          {error}
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
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Basic Information</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Tournament Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) });
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., Masters Tournament 2025"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Slug *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., masters-2025"
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
                resize: 'vertical',
              }}
              placeholder="Optional tournament description"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="e.g., Augusta, Georgia"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Timezone *
              </label>
              <select
                required
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
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
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Dates & Times</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
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
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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

          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '6px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.9375rem',
              color: '#fff',
            }}>
              <input
                type="checkbox"
                checked={formData.auto_manage_timing}
                onChange={(e) => setFormData({ ...formData, auto_manage_timing: e.target.checked })}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <div>
                <strong>Auto-calculate competition registration times</strong>
                <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem' }}>
                  Opens 7 days before, closes 15 minutes before first tee-off
                </div>
              </div>
            </label>

            {formData.auto_manage_timing && formData.start_date && (
              <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(59, 130, 246, 0.2)',
                fontSize: '0.875rem',
                color: 'rgba(255,255,255,0.8)',
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong style={{ color: '#60a5fa' }}>Preview:</strong>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Registration Opens:</span>{' '}
                    <strong>{getComputedRegOpen() ? new Date(getComputedRegOpen()!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255,255,255,0.6)' }}>Registration Closes:</span>{' '}
                    <strong>{getComputedRegClose() ? new Date(getComputedRegClose()!).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                    <i className="fas fa-info-circle"></i> These times will be automatically applied to all competitions for this tournament
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        <div style={{
          background: 'rgba(30, 30, 35, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.25rem' }}>Settings</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
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
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                External ID
              </label>
              <input
                type="text"
                value={formData.external_id}
                onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.625rem',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                }}
                placeholder="For API tracking"
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
              Image URL
            </label>
            <input
              type="text"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '4px',
                color: '#fff',
              }}
              placeholder="/images/tournaments/golf-bg-01.jpg or https://example.com/image.jpg"
            />
          </div>
        </div>

        {/* Auto-Create Competitions Section */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
            <input
              type="checkbox"
              id="auto-create-comps"
              checked={autoCreateComps}
              onChange={(e) => setAutoCreateComps(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            <label htmlFor="auto-create-comps" style={{ fontSize: '1rem', fontWeight: 600, color: '#60a5fa' }}>
              Auto-Create Main Competitions (6)
            </label>
          </div>
          
          {autoCreateComps && defaultCompetitions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
                Select which competitions to create and customize their default values:
              </p>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {defaultCompetitions.map((comp, index) => (
                  <div key={index} style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={comp.enabled}
                        onChange={(e) => updateCompetition(index, 'enabled', e.target.checked)}
                        style={{ marginRight: '0.5rem' }}
                      />
                      <label style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{comp.name}</label>
                    </div>
                    {comp.enabled && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginLeft: '1.5rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                            Entry Fee (£)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={(comp.entry_fee_pennies / 100).toFixed(2)}
                            onChange={(e) => updateCompetition(index, 'entry_fee_pennies', Math.round(parseFloat(e.target.value) * 100))}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '0.875rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                            Entrants Cap
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={comp.entrants_cap}
                            onChange={(e) => updateCompetition(index, 'entrants_cap', parseInt(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '0.875rem',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.25rem' }}>
                            Admin Fee (%)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={comp.admin_fee_percent}
                            onChange={(e) => updateCompetition(index, 'admin_fee_percent', parseFloat(e.target.value) || 0)}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'rgba(0,0,0,0.3)',
                              border: '1px solid rgba(255,255,255,0.2)',
                              borderRadius: '4px',
                              color: '#fff',
                              fontSize: '0.875rem',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.625rem 1.5rem',
              background: saving ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.9)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '0.9375rem',
            }}
          >
            {saving ? 'Creating...' : 'Create Tournament'}
          </button>
          <Link
            href="/tournaments"
            style={{
              padding: '0.625rem 1.5rem',
              background: 'rgba(100, 100, 100, 0.5)',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-block',
              fontSize: '0.9375rem',
            }}
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
