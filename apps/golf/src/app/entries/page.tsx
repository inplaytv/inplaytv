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
            {entries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <h3>{entry.entry_name || 'My Entry'}</h3>
                <p>Created: {new Date(entry.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
