'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  username: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  balance_cents: number;
  is_admin: boolean;
  app_metadata: any;
  user_metadata: any;
}

interface RecentActivity {
  type: 'entry' | 'transaction' | 'withdrawal';
  description: string;
  amount?: number;
  date: string;
}

export default function UsersList({ users: initialUsers, searchQuery }: { users: User[]; searchQuery?: string }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState(searchQuery || '');
  const [users, setUsers] = useState(initialUsers);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput) {
        params.set('q', searchInput);
      } else {
        params.delete('q');
      }
      router.push(`?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, router, searchParams]);

  // Filter users client-side for instant feedback
  useEffect(() => {
    if (!searchInput.trim()) {
      setUsers(initialUsers);
      return;
    }

    const lowerQuery = searchInput.toLowerCase();
    const filtered = initialUsers.filter(u =>
      u.email.toLowerCase().includes(lowerQuery) ||
      u.id.toLowerCase().includes(lowerQuery) ||
      u.username?.toLowerCase().includes(lowerQuery) ||
      u.phone?.includes(searchInput) ||
      u.first_name?.toLowerCase().includes(lowerQuery) ||
      u.last_name?.toLowerCase().includes(lowerQuery)
    );
    setUsers(filtered);
  }, [searchInput, initialUsers]);

  // Fetch recent activity when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setRecentActivity([]);
      return;
    }

    setLoadingActivity(true);
    fetch(`/api/users/${selectedUser.id}/activity`)
      .then(res => res.ok ? res.json() : [])
      .catch(() => [])
      .then(data => {
        setRecentActivity(data);
        setLoadingActivity(false);
      });
  }, [selectedUser]);

  const getStatusBadge = (user: User) => {
    if (user.is_admin) {
      return (
        <span style={{
          padding: '0.25rem 0.5rem',
          background: 'rgba(139, 92, 246, 0.2)',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#a78bfa',
          marginLeft: '0.5rem',
        }}>
          ADMIN
        </span>
      );
    }
    return null;
  };

  const getEmailStatus = (user: User) => {
    if (!user.email_confirmed_at) {
      return (
        <span style={{
          padding: '0.25rem 0.5rem',
          background: 'rgba(245, 158, 11, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '4px',
          fontSize: '0.7rem',
          fontWeight: 600,
          color: '#fbbf24',
        }}>
          PENDING
        </span>
      );
    }
    return (
      <span style={{
        padding: '0.25rem 0.5rem',
        background: 'rgba(16, 185, 129, 0.2)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        color: '#10b981',
      }}>
        VERIFIED
      </span>
    );
  };

  const formatFullName = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return null;
  };

  const formatAddress = (user: User) => {
    const parts = [
      user.address_line1,
      user.address_line2,
      user.city,
      user.postcode,
      user.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Search by name, email, username, phone..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            padding: '0.7rem 1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            width: '100%',
            maxWidth: '500px',
            fontSize: '0.9rem',
            color: '#fff',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.4)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        />
      </div>
      
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balance</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Last Sign In</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                style={{ 
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', fontWeight: 500 }}>
                        {formatFullName(user) || user.username || user.email}
                      </span>
                      {getStatusBadge(user)}
                    </div>
                    {formatFullName(user) && (
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
                        {user.email}
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  {getEmailStatus(user)}
                </td>
                <td style={{ padding: '1rem', fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>
                  £{(user.balance_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {user.last_sign_in_at 
                    ? new Date(user.last_sign_in_at).toLocaleDateString('en-GB', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })
                    : 'Never'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            No users found
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div 
          onClick={() => setSelectedUser(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(26, 26, 26, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>User Details</h2>
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Personal Information */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  Personal Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(selectedUser.first_name || selectedUser.last_name) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Full Name</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{formatFullName(selectedUser)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Email</span>
                    <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{selectedUser.email}</span>
                  </div>
                  {selectedUser.username && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Username</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{selectedUser.username}</span>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Phone</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{selectedUser.phone}</span>
                    </div>
                  )}
                  {selectedUser.date_of_birth && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Date of Birth</span>
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>
                        {new Date(selectedUser.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>User ID</span>
                    <span style={{ color: '#fff', fontSize: '0.75rem', fontFamily: 'monospace' }}>{selectedUser.id}</span>
                  </div>
                </div>
              </div>

              {/* Address */}
              {formatAddress(selectedUser) && (
                <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                    Address
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedUser.address_line1 && (
                      <div style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedUser.address_line1}</div>
                    )}
                    {selectedUser.address_line2 && (
                      <div style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedUser.address_line2}</div>
                    )}
                    <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {[selectedUser.city, selectedUser.postcode].filter(Boolean).join(', ')}
                    </div>
                    {selectedUser.country && (
                      <div style={{ color: '#fff', fontSize: '0.9rem' }}>{selectedUser.country}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  Account Status
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Email Verified</span>
                    {getEmailStatus(selectedUser)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Admin Access</span>
                    <span style={{ color: selectedUser.is_admin ? '#10b981' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 500 }}>
                      {selectedUser.is_admin ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  Wallet
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Current Balance</span>
                  <span style={{ color: '#10b981', fontSize: '1.1rem', fontWeight: 600 }}>
                    £{(selectedUser.balance_cents / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Account Activity */}
              <div style={{ paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  Account Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Account Created</span>
                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {new Date(selectedUser.created_at).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Last Sign In</span>
                    <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                      {selectedUser.last_sign_in_at
                        ? new Date(selectedUser.last_sign_in_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.75rem' }}>
                  Recent Activity
                </h3>
                {loadingActivity ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    Loading activity...
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {recentActivity.map((activity, index) => (
                      <div 
                        key={index}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 500 }}>
                            {activity.description}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                            {new Date(activity.date).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {activity.amount !== undefined && (
                          <span style={{ 
                            color: activity.amount >= 0 ? '#10b981' : '#ef4444', 
                            fontSize: '0.9rem', 
                            fontWeight: 600 
                          }}>
                            {activity.amount >= 0 ? '+' : ''}£{(Math.abs(activity.amount) / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
