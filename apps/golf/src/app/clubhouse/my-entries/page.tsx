'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import styles from './my-entries.module.css';

interface Entry {
  id: string;
  created_at: string;
  credits_paid: number;
  status: string;
  golfer_ids: string[];
  captain_id: string;
  competition: {
    id: string;
    name: string;
    event: {
      id: string;
      name: string;
      slug: string;
      status: string;
    };
  };
}

export default function MyEntriesPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  async function fetchEntries() {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('clubhouse_entries')
      .select(`
        *,
        competition:clubhouse_competitions(
          id,
          name,
          event:clubhouse_events(
            id,
            name,
            slug,
            status
          )
        )
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }

  const filteredEntries = entries.filter(entry => {
    if (filter === 'all') return true;
    if (filter === 'active') return entry.competition.event.status === 'open' || entry.competition.event.status === 'active';
    if (filter === 'completed') return entry.competition.event.status === 'completed';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      upcoming: '#6b7280',
      open: '#10b981',
      active: '#f59e0b',
      completed: '#6366f1'
    };

    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        borderRadius: '20px',
        fontSize: '0.75rem',
        fontWeight: 600,
        background: statusColors[status as keyof typeof statusColors] || '#6b7280',
        color: '#fff',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading your entries...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              <i className="fas fa-clipboard-list"></i>
              My Entries
            </h1>
            <p className={styles.subtitle}>Track your clubhouse tournament entries</p>
          </div>
          <Link href="/clubhouse/events" className={styles.enterBtn}>
            <i className="fas fa-plus"></i>
            Enter Event
          </Link>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({entries.length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'active' ? styles.active : ''}`}
            onClick={() => setFilter('active')}
          >
            Active ({entries.filter(e => e.competition.event.status === 'open' || e.competition.event.status === 'active').length})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'completed' ? styles.active : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed ({entries.filter(e => e.competition.event.status === 'completed').length})
          </button>
        </div>

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-inbox"></i>
            <h3>No entries found</h3>
            <p>You haven't entered any {filter !== 'all' ? filter : ''} events yet</p>
            <Link href="/clubhouse/events" className={styles.browseBtn}>
              Browse Events
            </Link>
          </div>
        ) : (
          <div className={styles.entriesList}>
            {filteredEntries.map(entry => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <div>
                    <h3>{entry.competition.event.name}</h3>
                    <p className={styles.compName}>{entry.competition.name}</p>
                  </div>
                  {getStatusBadge(entry.competition.event.status)}
                </div>

                <div className={styles.entryStats}>
                  <div className={styles.stat}>
                    <i className="fas fa-users"></i>
                    <span>{entry.golfer_ids.length} Golfers</span>
                  </div>
                  <div className={styles.stat}>
                    <i className="fas fa-star"></i>
                    <span>Captain Selected</span>
                  </div>
                  <div className={styles.stat}>
                    <i className="fas fa-coins"></i>
                    <span>{entry.credits_paid} Credits</span>
                  </div>
                  <div className={styles.stat}>
                    <i className="fas fa-calendar"></i>
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className={styles.entryActions}>
                  <Link 
                    href={`/clubhouse/leaderboard/${entry.competition.id}`} 
                    className={styles.viewBtn}
                  >
                    <i className="fas fa-trophy"></i>
                    View Leaderboard
                  </Link>
                  {entry.competition.event.status === 'open' && (
                    <button className={styles.withdrawBtn} disabled>
                      <i className="fas fa-times"></i>
                      Withdraw (Soon)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
