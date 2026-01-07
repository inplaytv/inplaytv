'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAdmin from '@/components/RequireAdmin';
import styles from './events-list.module.css';

interface ClubhouseEvent {
  id: string;
  name: string;
  venue?: string;
  description: string;
  status: 'upcoming' | 'open' | 'active' | 'completed';
  entry_credits: number;
  max_entries: number;
  current_entries: number;
  reg_open_at: string;
  reg_close_at: string;
  start_at: string;
  end_at: string;
  golfer_group?: {
    id: string;
    name: string;
  } | null;
}

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<ClubhouseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_GOLF_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/clubhouse/events`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const errorData = await res.text();
        console.error('[Admin Events] Error response:', errorData);
        throw new Error(`Failed to fetch events: ${res.status}`);
      }
      const data = await res.json();
      setEvents(data);
    } catch (err: any) {
      console.error('[Admin Events] Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this event? This cannot be undone.')) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_GOLF_API_URL || 'http://localhost:3003';
      const res = await fetch(`${apiUrl}/api/clubhouse/events/${id}`, {
        method: 'DELETE',
        cache: 'no-store',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete event');
      }
      
      // Immediately re-fetch the list instead of filtering locally
      await fetchEvents();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'upcoming': return '#94a3b8';     // Gray - Not started yet
      case 'reg_open': return '#22c55e';     // Green - Registration open
      case 'open': return '#22c55e';         // Green - Registration open (legacy)
      case 'live': return '#f59e0b';         // Orange - Tournament in progress
      case 'active': return '#f59e0b';       // Orange - Tournament in progress (legacy)
      case 'completed': return '#64748b';    // Dark gray - Finished
      default: return '#94a3b8';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'reg_open': return 'Reg Open';
      case 'open': return 'Reg Open';        // Legacy - treat as reg_open
      case 'live': return 'Live';
      case 'active': return 'Live';          // Legacy - treat as live
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  if (loading) {
    return (
      <RequireAdmin>
        <div className={styles.container}>
          <p>Loading events...</p>
        </div>
      </RequireAdmin>
    );
  }

  return (
    <RequireAdmin>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Clubhouse Events</h1>
          <Link href="/clubhouse/events/create" className={styles.createBtn}>
            + Create Event
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {events.length === 0 ? (
          <div className={styles.empty}>
            <p>No events created yet</p>
            <Link href="/clubhouse/events/create" className={styles.createBtn}>
              Create First Event
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {events.map(event => (
              <div key={event.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: event.venue && event.name ? '4px' : 0 }}>
                      {event.venue || event.name}
                    </h3>
                    {event.venue && event.name && (
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, color: '#64748b' }}>
                        {event.name}
                      </h4>
                    )}
                  </div>
                  <span 
                    className={styles.status}
                    style={{ background: getStatusColor(event.status) }}
                  >
                    {getStatusLabel(event.status)}
                  </span>
                </div>

                <p className={styles.description}>{event.description}</p>

                {event.golfer_group && (
                  <div style={{
                    padding: '8px 12px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '13px',
                  }}>
                    <span style={{ color: '#15803d', fontWeight: 600 }}>🏌️ Golfer Group:</span>
                    {' '}
                    <span style={{ color: '#166534' }}>{event.golfer_group.name}</span>
                  </div>
                )}

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Entry Cost</span>
                    <span className={styles.statValue}>{event.entry_credits} credits</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statLabel}>Entries</span>
                    <span className={styles.statValue}>
                      {event.current_entries} / {event.max_entries}
                    </span>
                  </div>
                </div>

                <div className={styles.dates}>
                  <div className={styles.date}>
                    <span>Reg Opens:</span>
                    <span>{new Date(event.reg_open_at).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.date}>
                    <span>Event Start:</span>
                    <span>{new Date(event.start_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link 
                    href={`/clubhouse/events/${event.id}/edit`}
                    className={styles.editBtn}
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(event.id)}
                    className={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAdmin>
  );
}
