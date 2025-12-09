'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import RequireAdmin from '@/components/RequireAdmin';

interface User {
  id: string;
  email: string;
  username: string | null;
  wallet_balance_cents: number;
}

export default function WalletManagementPage() {
  return (
    <RequireAdmin>
      <WalletManagementContent />
    </RequireAdmin>
  );
}

function WalletManagementContent() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      // Get all users with their wallet balances
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          username,
          wallets!inner(balance_cents)
        `)
        .order('email', { ascending: true });

      if (error) throw error;

      // Transform the data
      const usersData = data?.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        username: profile.username,
        wallet_balance_cents: profile.wallets?.balance_cents || 0,
      })) || [];

      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreditWallet() {
    if (!selectedUser || !creditAmount) {
      setMessage({ type: 'error', text: 'Please select a user and enter an amount' });
      return;
    }

    const amountPounds = parseFloat(creditAmount);
    if (isNaN(amountPounds) || amountPounds < 1 || amountPounds > 10000) {
      setMessage({ type: 'error', text: 'Please enter a valid amount between £1 and £10,000' });
      return;
    }

    const amountCents = Math.round(amountPounds * 100);

    setIsProcessing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          amount_cents: amountCents,
          reason: creditReason || 'admin_credit',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to credit wallet');
      }

      setMessage({ type: 'success', text: data.message });
      
      // Update the user's balance in the list
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, wallet_balance_cents: data.new_balance_cents }
          : u
      ));

      // Update selected user
      setSelectedUser({
        ...selectedUser,
        wallet_balance_cents: data.new_balance_cents,
      });

      // Reset form
      setCreditAmount('');
      setCreditReason('');

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to credit wallet' });
    } finally {
      setIsProcessing(false);
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
        Loading users...
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1.5rem', color: '#fff' }}>
        Wallet Management
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Users List */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Select User
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            />

            {/* Users List */}
            <div style={{
              maxHeight: '500px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  style={{
                    padding: '1rem',
                    background: selectedUser?.id === user.id 
                      ? 'rgba(102, 126, 234, 0.2)' 
                      : 'rgba(255,255,255,0.03)',
                    border: selectedUser?.id === user.id
                      ? '1px solid rgba(102, 126, 234, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUser?.id !== user.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUser?.id !== user.id) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {user.username || user.email}
                      </div>
                      {user.username && (
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {user.email}
                        </div>
                      )}
                    </div>
                    <div style={{
                      color: '#10b981',
                      fontWeight: 700,
                      fontSize: '1rem',
                    }}>
                      £{(user.wallet_balance_cents / 100).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'rgba(255,255,255,0.4)' 
                }}>
                  No users found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Credit Form */}
        <div>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Credit Wallet
            </h2>

            {selectedUser ? (
              <>
                {/* Selected User Info */}
                <div style={{
                  background: 'rgba(102, 126, 234, 0.1)',
                  border: '1px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                    Selected User
                  </div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {selectedUser.username || selectedUser.email}
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                    Current Balance: <span style={{ color: '#10b981', fontWeight: 600 }}>
                      £{(selectedUser.wallet_balance_cents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Amount Input */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}>
                    Amount (£)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    step="0.01"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                {/* Reason Input */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                  }}>
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    placeholder="e.g., Testing, Promotion, Compensation"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Quick amounts
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[5, 10, 20, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCreditAmount(amount.toString())}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '6px',
                          color: '#fff',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      >
                        £{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCreditWallet}
                  disabled={isProcessing || !creditAmount}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: isProcessing || !creditAmount
                      ? 'rgba(102, 126, 234, 0.3)'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: isProcessing || !creditAmount ? 'not-allowed' : 'pointer',
                    opacity: isProcessing || !creditAmount ? 0.6 : 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : '✅ Credit Wallet'}
                </button>

                {/* Message */}
                {message && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: message.type === 'success'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '8px',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    fontSize: '0.875rem',
                  }}>
                    {message.text}
                  </div>
                )}
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                color: 'rgba(255,255,255,0.4)',
              }}>
                👈 Select a user to credit their wallet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
