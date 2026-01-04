'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequireAdmin from '@/components/RequireAdmin';
import styles from '../../create/create-event.module.css';

export default function EditEventPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    status: 'upcoming',
    entry_credits: 0,
    max_entries: 0,
    start_date: '',
    end_date: '',
    registration_opens: '',
    registration_closes: '',
    round1_tee_time: '',
    round2_tee_time: '',
    round3_tee_time: '',
    round4_tee_time: '',
  });

  const [hasRoundTimes, setHasRoundTimes] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  async function fetchEvent() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_GOLF_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/clubhouse/events/${id}`);
      if (!res.ok) throw new Error('Failed to load event');
      
      const event = await res.json();
      
      // Convert ISO timestamps to datetime-local format
      const formatDateForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      // Detect if event uses new multi-round format
      const usesRoundTimes = !!event.round1_tee_time;
      setHasRoundTimes(usesRoundTimes);

      setFormData({
        name: event.name,
        description: event.description || '',
        location: event.location || '',
        status: event.status || 'upcoming',
        entry_credits: event.entry_credits,
        max_entries: event.max_entries,
        start_date: formatDateForInput(event.start_at),
        end_date: formatDateForInput(event.end_at),
        registration_opens: formatDateForInput(event.reg_open_at),
        registration_closes: formatDateForInput(event.reg_close_at),
        round1_tee_time: usesRoundTimes ? formatDateForInput(event.round1_tee_time) : '',
        round2_tee_time: usesRoundTimes ? formatDateForInput(event.round2_tee_time) : '',
        round3_tee_time: usesRoundTimes ? formatDateForInput(event.round3_tee_time) : '',
        round4_tee_time: usesRoundTimes ? formatDateForInput(event.round4_tee_time) : '',
      });
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_GOLF_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/clubhouse/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update event');
      }

      router.push('/clubhouse/events');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', color: '#fff' }}>
          Loading event...
        </div>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {error && <div style={{
          padding: '0.75rem',
          background: '#fee',
          color: '#c00',
          borderRadius: '6px',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{
          background: '#1a1a1a',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Event Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masters Clubhouse Championship"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Event description..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Augusta National Golf Club"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Status *
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="upcoming">Upcoming</option>
                <option value="open">Open (Registration Active)</option>
                <option value="active">Active (Event In Progress)</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                💡 Status auto-updates based on dates, but you can override it manually here
              </div>
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Entry Credits *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.entry_credits}
                onChange={(e) => setFormData({...formData, entry_credits: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Max Entries *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.max_entries}
                onChange={(e) => setFormData({...formData, max_entries: parseInt(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                Start Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                End Date *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                Registration Opens *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_opens}
                onChange={(e) => setFormData({...formData, registration_opens: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                Registration Closes *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.registration_closes}
                onChange={(e) => setFormData({...formData, registration_closes: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.8rem',
                }}
              />
            </div>
          </div>

          {/* Round Tee Times Section */}
          {hasRoundTimes && (
            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem', background: 'rgba(14, 184, 166, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 184, 166, 0.2)' }}>
              <h3 style={{ color: '#daa520', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Round Tee Times</h3>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                Set tee times for each round. Competitions will automatically close 15 minutes before each round starts.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                    Round 1 Tee Time *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasRoundTimes}
                    value={formData.round1_tee_time}
                    onChange={(e) => setFormData({...formData, round1_tee_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#0a0f1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                    Round 2 Tee Time *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasRoundTimes}
                    value={formData.round2_tee_time}
                    onChange={(e) => setFormData({...formData, round2_tee_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#0a0f1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                    Round 3 Tee Time *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasRoundTimes}
                    value={formData.round3_tee_time}
                    onChange={(e) => setFormData({...formData, round3_tee_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#0a0f1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                    Round 4 Tee Time *
                  </label>
                  <input
                    type="datetime-local"
                    required={hasRoundTimes}
                    value={formData.round4_tee_time}
                    onChange={(e) => setFormData({...formData, round4_tee_time: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: '#0a0f1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '0.75rem 1.5rem',
                background: saving ? '#555' : 'linear-gradient(135deg, #228b22 0%, #daa520 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? 'Saving...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </RequireAdmin>
  );
}
