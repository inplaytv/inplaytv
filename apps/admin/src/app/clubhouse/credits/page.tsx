'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import styles from './credits.module.css';

interface User {
  id: string;
  email: string;
  profiles: {
    display_name: string;
    first_name: string;
    last_name: string;
  } | null;
}

interface Wallet {
  user_id: string;
  credits: number;
  updated_at: string;
}

export default function ClubhouseCreditsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [amount, setAmount] = useState<number>(1000);
  const [reason, setReason] = useState<string>('Admin grant');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadUsers();
    loadWallets();
  }, []);

  async function loadUsers() {
    try {
      const response = await fetch('/api/clubhouse/admin/users');
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      
      const usersWithEmail = result.users.map((user: any) => ({
        id: user.id,
        email: user.email,
        profiles: {
          display_name: user.display_name,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      }));

      setUsers(usersWithEmail);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users. Please refresh the page.' });
    }
  }

  async function loadWallets() {
    try {
      // Add cache-busting timestamp
      const response = await fetch(`/api/clubhouse/admin/wallets?t=${Date.now()}`, {
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const result = await response.json();
      
      const walletMap: Record<string, Wallet> = {};
      result.wallets.forEach((wallet: Wallet) => {
        walletMap[wallet.user_id] = wallet;
      });
      setWallets(walletMap);
    } catch (error) {
      console.error('Error loading wallets:', error);
    }
  }

  async function grantCredits() {
    if (!selectedUser) {
      setMessage({ type: 'error', text: 'Please select a user' });
      return;
    }

    if (amount === 0) {
      setMessage({ type: 'error', text: 'Amount must be non-zero' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('🚀 Frontend sending:', { user_id: selectedUser, amount, reason });

      const response = await fetch('/api/clubhouse/admin/grant-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser,
          amount,
          reason,
        }),
      });

      const result = await response.json();
      console.log('📥 Frontend received:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to grant credits');
      }

      setMessage({
        type: 'success',
        text: `Successfully ${amount > 0 ? 'granted' : 'deducted'} ${Math.abs(amount)} credits. New balance: ${result.new_balance}`,
      });

      // Reload wallets to show updated balance
      await loadWallets();
      
      // Force re-render by clearing and reloading
      setWallets({});
      setTimeout(async () => {
        await loadWallets();
      }, 100);

      // Reset form
      setAmount(1000);
      setReason('Admin grant');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      user.profiles?.display_name?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Grant Clubhouse Credits</h1>
        <p>Add or remove credits from user wallets</p>
      </div>

      <div className={styles.content}>
        <div className={styles.grantSection}>
          <h2>Grant/Deduct Credits</h2>

          <div className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="search">Search Users</label>
              <input
                id="search"
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="user">Select User</label>
              <select
                id="user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.select}
              >
                <option value="">-- Choose User --</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.profiles?.display_name || user.email} ({user.email})
                    {wallets[user.id] ? ` - ${(wallets[user.id] as any).balance_credits} credits` : ' - No wallet'}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="amount">Amount</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className={styles.input}
                placeholder="Enter amount (positive to add, negative to deduct)"
              />
              <small>Use negative numbers to deduct credits</small>
            </div>

            <div className={styles.field}>
              <label htmlFor="reason">Reason</label>
              <input
                id="reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={styles.input}
                placeholder="Why are you granting/deducting these credits?"
              />
            </div>

            {message && (
              <div className={`${styles.message} ${styles[message.type]}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={grantCredits}
              disabled={loading || !selectedUser}
              className={styles.submitButton}
            >
              {loading ? 'Processing...' : amount > 0 ? 'Grant Credits' : 'Deduct Credits'}
            </button>
          </div>
        </div>

        <div className={styles.walletsSection}>
          <h2>All Wallets</h2>
          <div className={styles.walletsGrid}>
            {users.map(user => {
              const wallet = wallets[user.id];
              return (
                <div key={user.id} className={styles.walletCard}>
                  <div className={styles.walletUser}>
                    <strong>{user.profiles?.display_name || user.email}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className={styles.walletBalance}>
                    {wallet ? (
                      <>
                        <span className={styles.credits}>{(wallet as any).balance_credits}</span>
                        <span className={styles.creditsLabel}>credits</span>
                      </>
                    ) : (
                      <span className={styles.noWallet}>No wallet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
