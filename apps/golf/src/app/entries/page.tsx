'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import styles from './entries.module.css';

export const dynamic = 'force-dynamic';

interface Entry {
  id: string;
  entry_name: string | null;
  created_at: string;
  entry_fee_paid: number;
  competition: {
    id: string;
    tournament: {
      name: string;
      status: string;
    };
    competition_type: {
      name: string;
    };
    start_date: string;
    end_date: string;
  };
  picks: Array<{
    golfer_id: string;
    is_captain: boolean;
  }>;
}

export default function EntriesPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/user/my-entries');
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      setEntries(data.entries || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(entry: Entry): 'live' | 'upcoming' | 'completed' {
    if (!entry.competition) return 'upcoming';
    const now = new Date();
    const startDate = new Date(entry.competition.start_date);
    const endDate = new Date(entry.competition.end_date);
    
    if (now >= startDate && now <= endDate) return 'live';
    if (now < startDate) return 'upcoming';
    return 'completed';
  }

  return (
    <RequireAuth>
      <main className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>My Scorecards</h1>
            <p className={styles.subtitle}>Manage your tournament entries</p>
          </div>
          <button
            className={styles.newEntry}
            onClick={() => router.push('/tournaments')}
          >
            <i className="fas fa-plus"></i>
            Build New Team
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading your scorecards...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏌️</div>
            <h2>No Scorecards Yet</h2>
            <p>Create your first team to get started</p>
            <button
              className={styles.cta}
              onClick={() => router.push('/tournaments')}
            >
              <i className="fas fa-plus"></i>
              Build Your Team
            </button>
          </div>
        ) : (
          <div className={styles.entriesList}>
            <p>Found {entries.length} scorecards</p>
            {entries.map((entry) => {
              const status = getStatus(entry);
              return (
                <div key={entry.id} className={`${styles.entryCard} ${styles[status]}`}>
                  <div className={styles.entryHeader}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <div className={`${styles.statusIndicator} ${styles[status]}`}>
                          {status === 'live' && <div className={styles.pulse}></div>}
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          textTransform: 'uppercase',
                          color: status === 'live' ? '#66ea9e' : status === 'upcoming' ? '#ffc107' : 'rgba(255,255,255,0.5)'
                        }}>
                          {status === 'live' ? '🔴 Live Now' : status === 'upcoming' ? '📅 Upcoming' : '✓ Completed'}
                        </span>
                      </div>
                      <h3>{entry.entry_name || 'My Entry'}</h3>
                      <p className={styles.tournamentName}>
                        {entry.competition?.tournament?.name || 'Tournament'}
                      </p>
                      <p className={styles.competitionType}>
                        {entry.competition?.competition_type?.name || 'Competition'}
                      </p>
                    </div>
                    <div className={styles.entryMeta}>
                      <span className={styles.entryFee}>
                        £{((entry.entry_fee_paid || 0) / 100).toFixed(2)}
                      </span>
                      <span className={styles.entryDate}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
