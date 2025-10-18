'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Header from '@/components/Header';
import { formatPounds } from '@/lib/money';

export const dynamic = 'force-dynamic';

function WalletPageContent() {
  const supabase = createClient();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load balance
    const { data: walletData } = await supabase
      .from('wallets')
      .select('balance_cents')
      .eq('user_id', user.id)
      .single();

    if (walletData) {
      setBalance(walletData.balance_cents);
    }

    // Load transactions
    const { data: txData } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (txData) {
      setTransactions(txData);
    }

    setLoading(false);
  }

  // TODO: Replace with real PSP integration (Stripe, PayPal, etc.)
  async function handleTestTopUp() {
    setError('');
    
    // Test top-up of £5.00 (500 pence)
    const { data, error: rpcError } = await supabase.rpc('wallet_apply', {
      change_cents: 500,
      reason: 'topup:manual-test',
    });

    if (rpcError) {
      setError('Failed to top up: ' + rpcError.message);
    } else {
      // Reload wallet
      loadWallet();
    }
  }

  if (loading) {
    return (
      <>
        <Header />
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          Loading wallet...
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem', color: '#fff' }}>
          My Wallet
        </h1>

        {/* Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.5rem' }}>
            Current Balance
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: '#fff' }}>
            {formatPounds(balance)}
          </div>
          <button
            onClick={handleTestTopUp}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            💳 Test Top Up £5.00
          </button>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
            TODO: Integrate real payment provider
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            color: '#ff6b6b',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Transactions */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>
              Transaction History
            </h2>
          </div>

          {transactions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
              No transactions yet
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Date
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Description
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Amount
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        {new Date(tx.created_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                        {tx.reason}
                      </td>
                      <td style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: tx.change_cents > 0 ? '#66ea9e' : '#ff6b6b',
                      }}>
                        {tx.change_cents > 0 ? '+' : ''}{formatPounds(tx.change_cents)}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
                        {formatPounds(tx.balance_after_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function WalletPage() {
  return (
    <RequireAuth>
      <WalletPageContent />
    </RequireAuth>
  );
}
