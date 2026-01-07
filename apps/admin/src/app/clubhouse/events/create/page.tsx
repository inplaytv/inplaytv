'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RequireAdmin from '@/components/RequireAdmin';
import styles from './create-event.module.css';

interface GolferGroup {
  id: string;
  name: string;
  golfer_count: number;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [golferGroups, setGolferGroups] = useState<GolferGroup[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  
  // Get the master tournament ID from env or use fallback
  const masterTournamentId = process.env.NEXT_PUBLIC_CLUBHOUSE_MASTER_TOURNAMENT_ID || '00000000-0000-0000-0000-000000000001';
  
  const [formData, setFormData] = useState({
    venue: '',
    name: '',
    slug: '', // Auto-generated from name
    description: '',
    location: '',
    status: 'upcoming', // Default status for new events
    entry_credits: 0,
    max_entries: 0,
    registration_opens: '', // When registration starts
    round1_tee_time: '',
    round2_tee_time: '',
    round3_tee_time: '',
    round4_tee_time: '',
    end_date: '',
    assigned_golfer_group_id: '',
    linked_tournament_id: '', // NEW: Optional link to InPlay tournament
  });

  // Auto-generate slug from name
  useEffect(() => {
    if (formData.name) {
      const slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name]);

  // Auto-calculate registration opens (5 days before Round 1)
  useEffect(() => {
    if (formData.round1_tee_time && !formData.registration_opens) {
      const regOpens = new Date(new Date(formData.round1_tee_time).getTime() - (5 * 24 * 60 * 60 * 1000))
        .toISOString().slice(0, 16);
      setFormData(prev => ({ ...prev, registration_opens: regOpens }));
    }
  }, [formData.round1_tee_time]);

  // Restore form data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('clubhouse_event_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('[Create Event] Restored form data from draft');
        setFormData(parsed);
      } catch (err) {
        console.error('Failed to restore form draft:', err);
      }
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData.name || formData.description || formData.location) {
      localStorage.setItem('clubhouse_event_draft', JSON.stringify(formData));
    }
  }, [formData]);

  // Fetch golfer groups on mount
  useEffect(() => {
    fetchGolferGroups();
    fetchTournaments();
  }, []);

  // Auto-refresh golfer groups when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('[Create Event] Window focused - refreshing golfer groups');
      fetchGolferGroups();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Listen for localStorage updates (when groups are created in manage-golfers page)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clubhouse_golfer_groups_updated') {
        console.log('[Create Event] Detected golfer groups update from another tab');
        fetchGolferGroups();
      }
    };

    // Check for updates every 2 seconds (for same-tab updates)
    const interval = setInterval(() => {
      const lastUpdate = localStorage.getItem('clubhouse_golfer_groups_updated');
      if (lastUpdate) {
        const lastCheck = localStorage.getItem('clubhouse_last_check');
        if (lastUpdate !== lastCheck) {
          console.log('[Create Event] Detected golfer groups update - refreshing');
          localStorage.setItem('clubhouse_last_check', lastUpdate);
          fetchGolferGroups();
        }
      }
    }, 2000);

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  async function fetchGolferGroups() {
    try {
      // Use relative URL to fetch from admin app's own API (port 3002)
      const res = await fetch('/api/golfer-groups', {
        cache: 'no-store', // Ensure fresh data
      });
      if (res.ok) {
        const data = await res.json();
        setGolferGroups(data);
      } else {
        console.error('Failed to fetch golfer groups:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Failed to fetch golfer groups:', err);
    }
  }

  async function fetchTournaments() {
    try {
      const res = await fetch('/api/tournaments', {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        // Filter to active/upcoming tournaments
        const activeTournaments = data.filter((t: Tournament) => 
          ['upcoming', 'registration_open', 'in_progress'].includes(t.status)
        );
        setTournaments(activeTournaments);
      } else {
        console.error('Failed to fetch tournaments:', res.status);
      }
    } catch (err) {
      console.error('Failed to fetch tournaments:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate golfer group selection
    if (!formData.assigned_golfer_group_id) {
      const confirmed = window.confirm(
        '⚠️ WARNING: No Golfer Group Selected\n\n' +
        'Creating an event without a golfer group will add ALL 759 golfers to the team builder, ' +
        'which creates a poor user experience.\n\n' +
        'We STRONGLY recommend:\n' +
        '1. Cancel this form\n' +
        '2. Click "Import Golfers" to import from a tournament\n' +
        '3. Or click "View Groups" to create a custom group\n' +
        '4. Then return here and select the group\n\n' +
        'Do you want to continue WITHOUT a golfer group? (Not recommended)'
      );
      
      if (!confirmed) {
        setLoading(false);
        return;
      }
    }

    // Validate dates
    const round1 = new Date(formData.round1_tee_time);
    const round2 = new Date(formData.round2_tee_time);
    const round3 = new Date(formData.round3_tee_time);
    const round4 = new Date(formData.round4_tee_time);
    const endDate = new Date(formData.end_date);

    // Check: All round tee times are provided
    if (!formData.round1_tee_time || !formData.round2_tee_time || 
        !formData.round3_tee_time || !formData.round4_tee_time) {
      setError('All 4 round tee times are required');
      setLoading(false);
      return;
    }

    // Check: Rounds are in chronological order
    if (round2 <= round1 || round3 <= round2 || round4 <= round3) {
      setError('Round tee times must be in chronological order');
      setLoading(false);
      return;
    }

    // Check: End date after last round
    if (endDate <= round4) {
      setError('End date must be after Round 4 tee time');
      setLoading(false);
      return;
    }

    // Auto-calculate registration opens (5 days before Round 1)
    const registration_opens = new Date(round1.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_GOLF_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/clubhouse/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, registration_opens }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create event');
      }

      // Clear draft on success
      localStorage.removeItem('clubhouse_event_draft');
      console.log('[Create Event] Event created successfully, draft cleared');
      
      router.push('/clubhouse/events');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
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
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
                Golf Club Name *
              </label>
              <input
                type="text"
                required
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
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
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                💡 The venue/golf course where this event is held (main header)
              </div>
            </div>

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
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                💡 The tournament name (sub-header, usually matches InPlay tournament)
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff', fontSize: '0.875rem' }}>
                Slug (URL-friendly name) *
              </label>
              <input
                type="text"
                required
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                placeholder="masters-clubhouse-championship"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#999',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                }}
                readOnly
              />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                Auto-generated from event name
              </div>
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
                }}
              >
                <option value="upcoming">Upcoming</option>
                <option value="reg_open">Registration Open</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                New events typically start as "Upcoming"
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

            <div style={{ gridColumn: '1 / -1', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 500 }}>
                  Golfer Group (Available Players)
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={`/tournaments/${masterTournamentId}/manage-golfers`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'rgba(14, 184, 166, 0.1)',
                      color: '#daa520',
                      border: '1px solid rgba(14, 184, 166, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(14, 184, 166, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(14, 184, 166, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(14, 184, 166, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(14, 184, 166, 0.3)';
                    }}
                  >
                    📊 Import Golfers
                  </a>
                  <a
                    href="/golfers/groups"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: '#818cf8',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    👥 View Groups
                  </a>
                  <button
                    type="button"
                    onClick={fetchGolferGroups}
                    style={{
                      padding: '0.4rem 0.75rem',
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                    }}
                  >
                    🔄 Refresh
                  </button>
                </div>
              </div>
              <select
                value={formData.assigned_golfer_group_id}
                onChange={(e) => setFormData({...formData, assigned_golfer_group_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: formData.assigned_golfer_group_id ? '#fff' : '#999',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">All Golfers (No Group)</option>
                {golferGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.golfer_count} golfers)
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                Select which golfers will be available for this event. Leave blank to allow all golfers.
              </div>
            </div>

            {/* Tournament Linking (DataGolf Integration - Option A) */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.4rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Link to InPlay Tournament (Optional)
              </label>
              <select
                value={formData.linked_tournament_id}
                onChange={(e) => setFormData({...formData, linked_tournament_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0a0f1a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: formData.linked_tournament_id ? '#fff' : '#999',
                  fontSize: '0.875rem',
                }}
              >
                <option value="">None (Use Golfer Group above)</option>
                {tournaments.map((tournament) => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.75rem', color: 'rgba(218, 165, 32, 0.8)', marginTop: '0.4rem', display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
                <span>💡</span>
                <span>
                  When linked tournament syncs from DataGolf, this event will automatically use those golfers (overrides Golfer Group selection)
                </span>
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem', background: 'rgba(14, 184, 166, 0.05)', borderRadius: '8px', border: '1px solid rgba(14, 184, 166, 0.2)' }}>
              <h3 style={{ color: '#daa520', fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Tournament Dates & Registration</h3>
              
              <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>
                  Auto-set to 5 days before Round 1, but you can adjust
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem' }}>
                Set tee times for each round. Registration will automatically close 15 minutes before Round 1 starts.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                    Round 1 Tee Time * (Tournament Start)
                  </label>
                  <input
                    type="datetime-local"
                    required
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
                    required
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
                    required
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
                    required
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

            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.3rem', color: '#fff', fontSize: '0.8rem' }}>
                Tournament End Date *
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

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem', padding: '1rem', background: 'rgba(79, 70, 229, 0.05)', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
              <h3 style={{ color: '#a78bfa', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600 }}>Auto-Calculated Timing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                    Registration Opens
                  </label>
                  <div style={{
                    padding: '0.6rem',
                    background: 'rgba(79, 70, 229, 0.1)',
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    borderRadius: '6px',
                    color: '#a78bfa',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}>
                    {formData.registration_opens ? (() => {
                      try {
                        return new Date(formData.registration_opens).toLocaleString('en-GB', { 
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                        });
                      } catch {
                        return 'Set Round 1 tee time';
                      }
                    })() : 'Set Round 1 tee time'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                    5 days before Round 1
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                    Competitions Close
                  </label>
                  <div style={{
                    padding: '0.6rem',
                    background: 'rgba(79, 70, 229, 0.1)',
                    border: '1px solid rgba(79, 70, 229, 0.3)',
                    borderRadius: '6px',
                    color: '#a78bfa',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}>
                    15 min before each round
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                    Auto-calculated per round
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.625rem 1.25rem',
                background: loading ? '#374151' : 'linear-gradient(135deg, #228b22, #daa520)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all form data?')) {
                  localStorage.removeItem('clubhouse_event_draft');
                  setFormData({
                    venue: '',
                    name: '',
                    slug: '',
                    description: '',
                    location: '',
                    status: 'upcoming',
                    entry_credits: 0,
                    max_entries: 0,
                    registration_opens: '',
                    round1_tee_time: '',
                    round2_tee_time: '',
                    round3_tee_time: '',
                    round4_tee_time: '',
                    end_date: '',
                    assigned_golfer_group_id: '',
                    linked_tournament_id: '',
                  });
                }
              }}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Clear Form
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '0.625rem 1.25rem',
                background: '#374151',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </RequireAdmin>
  );
}
