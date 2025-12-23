'use client';

import { useState, useEffect } from 'react';

interface Admin {
  user_id: string;
  created_at: string;
  email?: string;
  full_name?: string;
  is_super_admin?: boolean;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      
      // Fetch admins via API (uses admin client, bypasses RLS)
      // Add cache buster to force fresh data
      const response = await fetch(`/api/admins/list?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch admins');
      
      const { admins: adminList } = await response.json();
      setAdmins(adminList);
    } catch (err: any) {
      console.error('Error fetching admins:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;

    try {
      setAdding(true);
      setError('');

      const response = await fetch('/api/admins/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add admin');
      }

      // Add new admin to list immediately
      if (result.admin) {
        setAdmins(prev => [...prev, result.admin]);
      }

      setNewAdminEmail('');
      setError(''); // Clear any previous errors
      
      // Show success message
      alert(`✅ ${result.message}\n\nNote: The new admin will receive a confirmation email.`);
    } catch (err: any) {
      console.error('Error adding admin:', err);
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;

    try {
      setError('');
      const response = await fetch(`/api/admins/${userId}/remove`, {
        method: 'DELETE',
        cache: 'no-store',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove admin');
      }

      // Remove from local state immediately for instant UI update
      setAdmins(prev => prev.filter(admin => admin.user_id !== userId));
      
      // Show success message
      alert(`✅ ${result.message}`);
      
      // Force refresh from server with delay to ensure database has updated
      setTimeout(() => {
        fetchAdmins();
      }, 100);
    } catch (err: any) {
      console.error('Error removing admin:', err);
      setError(err.message);
      alert(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          Admin Management
        </h1>

        {/* Add New Admin */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: '#fff' }}>
            Add New Admin
          </h2>
          <form onSubmit={handleAddAdmin} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="email"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="Enter user email address"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#2a2a2a',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                }}
                required
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              style={{
                padding: '0.75rem 1.5rem',
                background: adding ? '#666' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: adding ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              {adding ? 'Adding...' : 'Add Admin'}
            </button>
          </form>
          {error && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: 'rgba(239, 68, 68, 0.1)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Admins List */}
        <div style={{
          background: '#1e1e1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
              Current Admins ({admins.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              Loading admins...
            </div>
          ) : admins.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>
              No admins found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Email
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Full Name
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Role
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Added On
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#888', fontSize: '0.875rem', fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.user_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        {admin.email}
                      </td>
                      <td style={{ padding: '1rem', color: '#fff', fontSize: '0.875rem' }}>
                        {admin.full_name}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                        {admin.is_super_admin ? (
                          <span style={{ 
                            padding: '0.25rem 0.75rem', 
                            background: '#f59e0b', 
                            color: '#000',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}>
                            SUPER ADMIN
                          </span>
                        ) : (
                          <span style={{ color: '#888' }}>Admin</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', color: '#888', fontSize: '0.875rem' }}>
                        {new Date(admin.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        {!admin.is_super_admin ? (
                          <button
                            onClick={() => handleRemoveAdmin(admin.user_id)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            Remove
                          </button>
                        ) : (
                          <span style={{ color: '#666', fontSize: '0.75rem' }}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
