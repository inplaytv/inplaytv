'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface GolferGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  member_count: number;
  added_at?: string;
}

interface Golfer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  image_url: string | null;
  external_id: string | null;
}

export default function TournamentGolfersPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tournamentGroups, setTournamentGroups] = useState<GolferGroup[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GolferGroup[]>([]);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importGroupName, setImportGroupName] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupGolfers, setGroupGolfers] = useState<Record<string, Golfer[]>>({});
  const [loadingGolfers, setLoadingGolfers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [params.id]);

  async function fetchData() {
    try {
      const [tournamentGroupsRes, allGroupsRes] = await Promise.all([
        fetch(`/api/tournaments/${params.id}/golfer-groups`),
        fetch('/api/golfer-groups'),
      ]);

      if (tournamentGroupsRes.ok) {
        const data = await tournamentGroupsRes.json();
        setTournamentGroups(data);
      }

      if (allGroupsRes.ok) {
        const data = await allGroupsRes.json();
        setAvailableGroups(data);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load golfer groups');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddGroup(groupId: string) {
    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfer-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId }),
      });

      if (res.ok) {
        setSuccess('Group added to tournament');
        setTimeout(() => setSuccess(''), 3000);
        await fetchData();
        setShowAddGroup(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add group');
        setTimeout(() => setError(''), 3000);
      }
    } catch (err) {
      setError('Network error');
      setTimeout(() => setError(''), 3000);
    }
  }

  async function handleRemoveGroup(groupId: string, groupName: string) {
    if (!confirm(`Remove "${groupName}" from this tournament?`)) return;

    try {
      const res = await fetch(`/api/tournaments/${params.id}/golfer-groups?group_id=${groupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSuccess('Group removed from tournament');
        setTimeout(() => setSuccess(''), 3000);
        await fetchData();
      } else {
        alert('Failed to remove group');
      }
    } catch (err) {
      alert('Network error');
    }
  }

  async function handleImportFromOWGR(e: React.FormEvent) {
    e.preventDefault();
    setImporting(true);
    setError('');

    try {
      // Call the import API endpoint
      const res = await fetch('/api/golfer-groups/import-owgr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: importUrl,
          group_name: importGroupName,
          tournament_id: params.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to import golfers');
      }

      const data = await res.json();
      setSuccess(`Imported ${data.golfers_count} golfers into group "${data.group_name}"`);
      setTimeout(() => setSuccess(''), 5000);
      setShowImportModal(false);
      setImportUrl('');
      setImportGroupName('');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setImporting(false);
    }
  }

  // Get groups not yet assigned to this tournament
  const unassignedGroups = availableGroups.filter(
    g => !tournamentGroups.find(tg => tg.id === g.id)
  );

  async function toggleGroupExpansion(groupId: string) {
    const newExpanded = new Set(expandedGroups);
    
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
      setExpandedGroups(newExpanded);
    } else {
      newExpanded.add(groupId);
      setExpandedGroups(newExpanded);
      
      // Load golfers if not already loaded
      if (!groupGolfers[groupId]) {
        setLoadingGolfers(new Set(loadingGolfers).add(groupId));
        try {
          const res = await fetch(`/api/golfer-groups/${groupId}/members`);
          if (res.ok) {
            const golfers = await res.json();
            setGroupGolfers({ ...groupGolfers, [groupId]: golfers });
          }
        } catch (err) {
          console.error('Failed to load golfers:', err);
        } finally {
          const newLoading = new Set(loadingGolfers);
          newLoading.delete(groupId);
          setLoadingGolfers(newLoading);
        }
      }
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <Link
          href="/tournaments"
          style={{
            color: '#60a5fa',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
            marginBottom: '10px',
          }}
        >
          ← Back to Tournaments
        </Link>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
          Tournament Golfers
        </h1>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #ddd',
        paddingBottom: '5px',
      }}>
        <Link
          href={`/tournaments/${params.id}`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0f0f0',
            border: '2px solid #ccc',
            borderRadius: '6px 6px 0 0',
            color: '#666',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          📋 Details & Competitions
        </Link>
        <Link
          href={`/tournaments/${params.id}/golfers`}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            border: '2px solid #0070f3',
            borderRadius: '6px 6px 0 0',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          ⛳ Golfers
        </Link>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '6px',
          color: '#f87171',
          marginBottom: '20px',
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '6px',
          color: '#10b981',
          marginBottom: '20px',
        }}>
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button
          onClick={() => setShowImportModal(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          🌐 Import from OWGR Website
        </button>
        
        {unassignedGroups.length > 0 && (
          <button
            onClick={() => setShowAddGroup(!showAddGroup)}
            style={{
              padding: '10px 20px',
              backgroundColor: showAddGroup ? '#666' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {showAddGroup ? '✕ Cancel' : '+ Add Existing Group'}
          </button>
        )}

        <Link
          href="/golfers/groups"
          style={{
            padding: '10px 20px',
            backgroundColor: '#6366f1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            display: 'inline-block',
            fontWeight: 'bold',
          }}
        >
          Manage All Groups
        </Link>
      </div>

      {/* Import from OWGR Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#1a1a1f',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '90%',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>
              Import Golfers from OWGR Website
            </h2>
            <form onSubmit={handleImportFromOWGR}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                  OWGR Event URL *
                </label>
                <input
                  type="url"
                  required
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  placeholder="https://www.owgr.com/events?eventId=..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '5px',
                    color: '#fff',
                  }}
                />
                <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                  Example: https://www.owgr.com/events?eventId=12345&year=2025
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                  Group Name *
                </label>
                <input
                  type="text"
                  required
                  value={importGroupName}
                  onChange={(e) => setImportGroupName(e.target.value)}
                  placeholder="e.g., Masters 2025 - Full Field"
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '5px',
                    color: '#fff',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportUrl('');
                    setImportGroupName('');
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: importing ? '#555' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: importing ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {importing ? 'Importing...' : 'Import Golfers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Existing Group Dropdown */}
      {showAddGroup && unassignedGroups.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>
            Select Group to Add:
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {unassignedGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleAddGroup(group.id)}
                style={{
                  padding: '15px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  border: `2px solid ${group.color}`,
                  borderRadius: '6px',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: group.color,
                    }}
                  />
                  <strong>{group.name}</strong>
                </div>
                <div style={{ fontSize: '14px', color: '#aaa', marginTop: '5px' }}>
                  {group.member_count} golfers
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Groups */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px', borderBottom: '2px solid #eee' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>
            Assigned Golfer Groups ({tournamentGroups.length})
          </h2>
        </div>

        {tournamentGroups.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#999' }}>
            <p style={{ fontSize: '16px', marginBottom: '10px' }}>
              No golfer groups assigned yet
            </p>
            <p style={{ fontSize: '14px' }}>
              Click "Import from OWGR Website" to create a group from a tournament URL,
              <br />
              or "Add Existing Group" to assign a pre-made group.
            </p>
          </div>
        ) : (
          <div style={{ padding: '20px' }}>
            {tournamentGroups.map((group) => (
              <div
                key={group.id}
                style={{
                  backgroundColor: '#f9f9f9',
                  border: `2px solid ${group.color}`,
                  borderRadius: '8px',
                  padding: '20px',
                  marginBottom: '15px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <button
                      onClick={() => toggleGroupExpansion(group.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0 5px',
                        color: '#333',
                      }}
                    >
                      {expandedGroups.has(group.id) ? '▼' : '▶'}
                    </button>
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: group.color,
                      }}
                    />
                    <h3 style={{ margin: 0, fontSize: '20px' }}>{group.name}</h3>
                  </div>
                  <div style={{ color: '#666', fontSize: '14px', marginBottom: '5px' }}>
                    <strong>{group.member_count}</strong> golfer{group.member_count !== 1 ? 's' : ''}
                  </div>
                  {group.description && (
                    <div style={{ color: '#888', fontSize: '13px' }}>
                      {group.description}
                    </div>
                  )}
                  {group.added_at && (
                    <div style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
                      Added {new Date(group.added_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* Expanded Golfers List */}
                  {expandedGroups.has(group.id) && (
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #ddd' }}>
                      {loadingGolfers.has(group.id) ? (
                        <div style={{ color: '#999', fontSize: '14px' }}>Loading golfers...</div>
                      ) : groupGolfers[group.id] && groupGolfers[group.id].length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                          {groupGolfers[group.id].map((golfer) => (
                            <div
                              key={golfer.id}
                              style={{
                                padding: '10px',
                                backgroundColor: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                fontSize: '14px',
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{golfer.full_name}</div>
                              {golfer.external_id && (
                                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                  OWGR: {golfer.external_id}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontSize: '14px' }}>No golfers in this group</div>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Link
                    href={`/golfers/groups/${group.id}`}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#0070f3',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  >
                    View/Edit
                  </Link>
                  <button
                    onClick={() => handleRemoveGroup(group.id, group.name)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
