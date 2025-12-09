'use client';

import { useState, useEffect } from 'react';
import RequireAdmin from '@/components/RequireAdmin';

interface User {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  balance_cents: number;
  created_at: string;
}

export default function WalletManagementPage() {
  return (
    <RequireAdmin>
      <WalletManagementContent />
    </RequireAdmin>
  );
}

function WalletManagementContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Credit modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [crediting, setCrediting] = useState(false);
  const [creditSuccess, setCreditSuccess] = useState(false);

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(term) ||
      (user.username && user.username.toLowerCase().includes(term)) ||
      (user.full_name && user.full_name.toLowerCase().includes(term))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/wallet/users');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function handleCredit() {
    if (!selectedUser || !creditAmount) return;

    const amountCents = Math.round(parseFloat(creditAmount) * 100);
    
    if (isNaN(amountCents) || amountCents < 100 || amountCents > 100000000) {
      setError('Amount must be between $1 and $1,000,000');
      return;
    }

    try {
      setCrediting(true);
      setError(null);
      
      const response = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount_cents: amountCents,
          reason: creditReason || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      // Update the user in the list
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, balance_cents: result.new_balance_cents }
          : u
      ));
      
      // Show success and reset form
      setCreditSuccess(true);
      setTimeout(() => {
        setSelectedUser(null);
        setCreditAmount('');
        setCreditReason('');
        setCreditSuccess(false);
      }, 2000);
      
    } catch (err) {
      console.error('Failed to credit wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to credit wallet');
    } finally {
      setCrediting(false);
    }
  }

  function formatCents(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)' }}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 700 }}>Wallet Management</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          Credit user wallets and view balances
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.5rem',
          color: '#ef4444'
        }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '1rem',
        marginBottom: '1.5rem',
      }}>
        <input
          type="text"
          placeholder="Search by email, username, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.7rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#fff',
            outline: 'none',
          }}
        />
      </div>

      {/* Users List */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {filteredUsers.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '10px',
            padding: '2rem',
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)'
          }}>
            {searchTerm ? 'No users found matching your search' : 'No users found'}
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <p style={{ fontWeight: 600, color: '#fff' }}>{user.email}</p>
                  {user.username && (
                    <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
                      @{user.username}
                    </span>
                  )}
                </div>
                {user.full_name && (
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>
                    {user.full_name}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Balance:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>
                    {formatCents(user.balance_cents)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(user)}
                disabled={selectedUser?.id === user.id}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: selectedUser?.id === user.id ? 'rgba(255,255,255,0.1)' : 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  color: '#10b981',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: selectedUser?.id === user.id ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (!selectedUser || selectedUser.id !== user.id) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)';
                  }
                }}
                onMouseOut={(e) => {
                  if (!selectedUser || selectedUser.id !== user.id) {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                  }
                }}
              >
                Credit Wallet
              </button>
            </div>
          ))
        )}
      </div>

      {/* Credit Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          zIndex: 50,
        }}>
          <div style={{
            width: '100%',
            maxWidth: '500px',
            background: 'rgba(20, 20, 30, 0.98)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '12px',
            padding: '2rem',
            backdropFilter: 'blur(10px)',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Credit Wallet</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Add funds to {selectedUser.email}'s wallet
            </p>
            
            {creditSuccess ? (
              <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✓</div>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#10b981' }}>
                  Wallet credited successfully!
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    max="1000000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    disabled={crediting}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                    Minimum: $1.00, Maximum: $1,000,000.00
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                    Reason (Optional)
                  </label>
                  <textarea
                    placeholder="e.g., Promotional credit, Refund, etc."
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    disabled={crediting}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.7rem 1rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: '#fff',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', paddingTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setCreditAmount('');
                      setCreditReason('');
                      setError(null);
                    }}
                    disabled={crediting}
                    style={{
                      flex: 1,
                      padding: '0.7rem 1.5rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: crediting ? 'not-allowed' : 'pointer',
                      opacity: crediting ? 0.5 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCredit}
                    disabled={crediting || !creditAmount}
                    style={{
                      flex: 1,
                      padding: '0.7rem 1.5rem',
                      background: (!crediting && creditAmount) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '6px',
                      color: (!crediting && creditAmount) ? '#10b981' : 'rgba(255,255,255,0.3)',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: (crediting || !creditAmount) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {crediting ? 'Processing...' : 'Confirm Credit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
