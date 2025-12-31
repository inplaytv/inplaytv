'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
  notified: boolean;
  notified_at: string | null;
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifiedFilter, setNotifiedFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, notified: 0, pending: 0 });

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/waitlist?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (response.ok) {
        const { entries: data } = await response.json();
        setEntries(data || []);
        
        // Calculate stats
        const total = data?.length || 0;
        const notified = data?.filter((e: WaitlistEntry) => e.notified).length || 0;
        setStats({ total, notified, pending: total - notified });
      }
    } catch (err) {
      console.error('Error fetching waitlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (email: string) => {
    if (!confirm(`Send launch notification to ${email}?`)) return;

    try {
      const response = await fetch('/api/waitlist/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert(`❌ Error: Server returned non-JSON response. Check console for details.`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert('✅ Notification sent!');
        fetchWaitlist();
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error notifying:', err);
      alert(`❌ Failed to send notification: ${err}`);
    }
  };

  const handleNotifyAll = async () => {
    const pending = entries.filter(e => !e.notified);
    if (!confirm(`Send launch notification to ${pending.length} people?`)) return;

    try {
      const response = await fetch('/api/waitlist/notify-all', {
        method: 'POST',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        alert(`❌ Error: Server returned non-JSON response. Check console for details.`);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message || `Sent ${pending.length} notifications!`}`);
        fetchWaitlist();
      } else {
        alert(`❌ Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error notifying all:', err);
      alert(`❌ Failed to send notifications: ${err}`);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Remove ${email} from waitlist?`)) return;

    try {
      const response = await fetch(`/api/waitlist/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Entry deleted!');
        fetchWaitlist();
      } else {
        const errorData = await response.json();
        alert(`❌ Failed to delete: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      alert(`❌ Failed to delete entry: ${err}`);
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ['Email', 'Source', 'Joined', 'Notified', 'Notified At'].join(','),
      ...filteredEntries.map(e => [
        e.email,
        e.source,
        new Date(e.created_at).toLocaleDateString(),
        e.notified ? 'Yes' : 'No',
        e.notified_at ? new Date(e.notified_at).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredEntries = entries.filter(e => {
    const matchesSearch = e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = notifiedFilter === 'all' || 
                         (notifiedFilter === 'notified' && e.notified) ||
                         (notifiedFilter === 'pending' && !e.notified);
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Coming Soon Waitlist
            </h1>
            <p style={{ color: '#888', fontSize: '0.875rem' }}>
              Manage email subscriptions from the coming soon page
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={handleExportCSV}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2a2a2a',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              📥 Export CSV
            </button>
            <button
              onClick={handleNotifyAll}
              disabled={stats.pending === 0}
              style={{
                padding: '0.75rem 1.5rem',
                background: stats.pending === 0 ? '#4b5563' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: stats.pending === 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              📧 Notify All ({stats.pending})
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>Total Signups</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fff' }}>{stats.total}</div>
          </div>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>Notified</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{stats.notified}</div>
          </div>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>Pending</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#fbbf24' }}>{stats.pending}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
          <select
            value={notifiedFilter}
            onChange={(e) => setNotifiedFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            <option value="all">All Entries ({stats.total})</option>
            <option value="pending">Pending ({stats.pending})</option>
            <option value="notified">Notified ({stats.notified})</option>
          </select>
        </div>

        {/* Entries Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            Loading waitlist...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>
            No waitlist entries found
          </div>
        ) : (
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>Source</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>Joined</th>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'right', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>{entry.email}</td>
                    <td style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>{entry.source}</td>
                    <td style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
                      {new Date(entry.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {entry.notified ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ 
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            background: '#10b981',
                            color: '#fff',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            width: 'fit-content'
                          }}>
                            Notified
                          </span>
                          {entry.notified_at && (
                            <span style={{ fontSize: '0.75rem', color: '#888' }}>
                              {new Date(entry.notified_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          background: '#fbbf24',
                          color: '#000',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                        }}>
                          Pending
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        {!entry.notified && (
                          <button
                            onClick={() => handleNotify(entry.email)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#3b82f6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Notify
                          </button>
                        )}
                        <Link
                          href={`/email/compose?to=${entry.email}`}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#2a2a2a',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                        >
                          Email
                        </Link>
                        <button
                          onClick={() => handleDelete(entry.id, entry.email)}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
