'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GolferGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  member_count?: number;
  created_at: string;
}

export default function GolferGroupsPage() {
  const [groups, setGroups] = useState<GolferGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  async function fetchGroups() {
    try {
      const response = await fetch('/api/golfer-groups');
      if (!response.ok) throw new Error('Failed to fetch groups');
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteGroup(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This will remove the group but keep the golfers.`)) return;

    try {
      const response = await fetch(`/api/golfer-groups/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      fetchGroups();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete group');
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <h1 style={{ 
            margin: '0 0 0.5rem 0',
            fontSize: '1.875rem',
            fontWeight: 700,
            color: '#fff',
          }}>
            Tournament Golfers
          </h1>
          <p style={{ 
            margin: 0,
            fontSize: '0.875rem',
            color: 'rgba(255,255,255,0.6)',
          }}>
            Create and manage golfer groups, then assign them to tournaments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <a
            href="data:text/csv;charset=utf-8,First Name,Last Name,World Ranking,Points Won%0ATiger,Woods,1,1500%0ARory,McIlroy,2,1400%0AScottie,Scheffler,3,1350"
            download="golfers-template.csv"
            style={{
              padding: '0.625rem 1.25rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Download Template
          </a>
          <button
            onClick={() => setShowImportModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Groups List */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        {loading ? (
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            Loading groups...
          </p>
        ) : groups.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
          }}>
            <p style={{
              margin: '0 0 1rem 0',
              fontSize: '0.875rem',
              color: 'rgba(255,255,255,0.6)',
            }}>
              No golfer groups yet
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.4)',
            }}>
              Click "Import from OWGR" or "Create Group" to get started
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {groups.map((group) => (
              <div
                key={group.id}
                style={{
                  padding: '1.5rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem',
                    }}>
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: group.color,
                      }} />
                      <h3 style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 600,
                        color: '#fff',
                      }}>
                        {group.name}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.625rem',
                        background: 'rgba(59,130,246,0.1)',
                        color: '#60a5fa',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        borderRadius: '4px',
                      }}>
                        {group.member_count || 0} golfers
                      </span>
                    </div>
                    {group.description && (
                      <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.6)',
                      }}>
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/golfers/groups/${group.id}`}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      View
                    </Link>
                    <button
                      onClick={() => deleteGroup(group.id, group.name)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'rgba(59,130,246,0.05)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: '12px',
      }}>
        <h3 style={{
          margin: '0 0 0.75rem 0',
          fontSize: '1rem',
          fontWeight: 600,
          color: '#60a5fa',
        }}>
          How it works
        </h3>
        <ol style={{
          margin: 0,
          paddingLeft: '1.25rem',
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.7)',
          lineHeight: '1.6',
        }}>
          <li>Import CSV with golfer names to create groups (Full Field, After Cut)</li>
          <li>Go to a tournament and assign both Full Field and After Cut groups</li>
          <li>Each competition can then select from all golfers or just those who made the cut</li>
        </ol>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}

function ImportCSVModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [groupName, setGroupName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleImport() {
    if (!file || !groupName) {
      alert('Please provide both a CSV file and group name');
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      // Parse CSV (expecting "First Name,Last Name,World Ranking,Points Won")
      const golfers: { firstName: string; lastName: string; worldRanking?: number; pointsWon?: number }[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.toLowerCase().includes('first') || trimmed.toLowerCase().includes('name')) continue;
        
        const parts = trimmed.split(',').map(p => p.trim());
        if (parts.length >= 2) {
          golfers.push({ 
            firstName: parts[0], 
            lastName: parts[1],
            worldRanking: parts[2] ? parseInt(parts[2]) : undefined,
            pointsWon: parts[3] ? parseFloat(parts[3]) : undefined,
          });
        } else if (parts.length === 1) {
          const nameParts = parts[0].split(' ');
          if (nameParts.length >= 2) {
            golfers.push({ 
              firstName: nameParts.slice(0, -1).join(' '), 
              lastName: nameParts[nameParts.length - 1] 
            });
          }
        }
      }

      if (golfers.length === 0) {
        alert('No valid golfer names found in CSV');
        setImporting(false);
        return;
      }

      const response = await fetch('/api/golfer-groups/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupName, golfers }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      alert(`Successfully imported ${result.golfersCreated} golfers into "${groupName}"`);
      onSuccess();
    } catch (error: any) {
      console.error('Import error:', error);
      alert(error.message || 'Failed to import golfers');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '500px',
        width: '90%',
      }}>
        <h2 style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#fff',
        }}>
          Import Golfers from CSV
        </h2>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
          }}>
            CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Format: "First Name,Last Name,World Ranking,Points Won"
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
          }}>
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Masters 2025 - Full Field"
            style={{
              width: '100%',
              padding: '0.625rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          />
          <p style={{
            margin: '0.5rem 0 0 0',
            fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.5)',
          }}>
            Suggested: "[Tournament] - Full Field" or "[Tournament] - After Cut"
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={importing}
            style={{
              padding: '0.625rem 1.25rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: importing ? 'not-allowed' : 'pointer',
              opacity: importing ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={importing}
            style={{
              padding: '0.625rem 1.25rem',
              background: '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: importing ? 'not-allowed' : 'pointer',
              opacity: importing ? 0.7 : 1,
            }}
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
