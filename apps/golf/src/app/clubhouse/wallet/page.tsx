'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import RequireAuth from '@/components/RequireAuth';

interface Transaction {
  id: string;
  amount_credits: number;
  balance_after: number;
  description: string;
  transaction_type: string;
  created_at: string;
}

export default function ClubhouseWalletPage() {
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Load current balance
    const { data: wallet } = await supabase
      .from('clubhouse_wallets')
      .select('balance_credits')
      .eq('user_id', user.id)
      .single();

    if (wallet) setCredits(wallet.balance_credits);

    // Load transactions
    const { data: txns } = await supabase
      .from('clubhouse_credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txns) setTransactions(txns);
    setLoading(false);
  }

  if (loading) {
    return (
      <RequireAuth>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ color: '#228b22', marginBottom: '2rem' }}>My Wallet</h1>

        <div
          style={{
            padding: '2rem',
            background: 'linear-gradient(135deg, #daa520, #228b22)',
            color: 'white',
            borderRadius: '12px',
            marginBottom: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', opacity: 0.9 }}>
            Available Credits
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>{credits}</div>
        </div>

        <h2 style={{ marginBottom: '1rem', color: '#374151' }}>Transaction History</h2>

        {transactions.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center',
            background: '#f9fafb',
            borderRadius: '12px',
          }}>
            <p style={{ color: '#6b7280' }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {transactions.map((txn) => (
              <div
                key={txn.id}
                style={{
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: '#111827', marginBottom: '0.25rem' }}>
                    {txn.description}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {new Date(txn.created_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      color: txn.amount_credits > 0 ? '#059669' : '#dc2626',
                      marginBottom: '0.25rem',
                    }}
                  >
                    {txn.amount_credits > 0 ? '+' : ''}{txn.amount_credits}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    Balance: {txn.balance_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
