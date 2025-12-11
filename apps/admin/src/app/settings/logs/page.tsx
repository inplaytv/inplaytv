'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';

interface LogEntry {
  id: string;
  created_at: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  metadata?: any;
  user_id?: string;
  user_email?: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'debug'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      let query = supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('level', filter);
      }

      const { data, error } = await query;

      if (error) {
        // If logs table doesn't exist, show placeholder
        console.error('Error fetching logs:', error);
        setLogs([]);
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => 
    searchTerm === '' || 
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      case 'debug': return '#8b5cf6';
      default: return '#888';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'info': return 'rgba(59, 130, 246, 0.1)';
      case 'debug': return 'rgba(139, 92, 246, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          System Logs
        </h1>

        {/* Filters */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'info', 'warning', 'error', 'debug'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filter === level ? '#3b82f6' : '#2a2a2a',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {level}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.5rem 1rem',
              background: '#2a2a2a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />

          <button
            onClick={fetchLogs}
            style={{
              padding: '0.5rem 1rem',
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            Refresh
          </button>
        </div>

        {/* Logs List */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              <p style={{ marginBottom: '0.5rem' }}>No logs found</p>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>
                Note: Logging system needs to be set up in your application
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: getLevelBg(log.level),
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: getLevelColor(log.level),
                        color: '#fff',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {log.level}
                    </span>
                    <span style={{ color: '#888', fontSize: '0.875rem' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                    {log.user_email && (
                      <span style={{ color: '#888', fontSize: '0.875rem' }}>
                        User: {log.user_email}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#fff', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    {log.message}
                  </div>
                  {log.metadata && (
                    <details style={{ marginTop: '0.5rem' }}>
                      <summary style={{ color: '#888', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Show metadata
                      </summary>
                      <pre style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#000',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#10b981',
                        overflowX: 'auto',
                      }}>
                        {JSON.stringify(log.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
