'use client';

import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { formatPounds } from '@/lib/money';

export const dynamic = 'force-dynamic';

function WalletPageContent() {
  const supabase = createClient();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [demoAmount, setDemoAmount] = useState(0);
  const [userEmail, setUserEmail] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  useEffect(() => {
    loadWallet();
    
    // Check for success query param
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status === 'success') {
      setSuccessMessage('Top-up successful! Your wallet has been credited.');
      window.history.replaceState({}, '', '/wallet');
    } else if (status === 'success-demo') {
      setSuccessMessage('Demo top-up credited successfully!');
      window.history.replaceState({}, '', '/wallet');
    }
  }, []);

  async function loadWallet() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Store user email for demo modal
    setUserEmail(user.email || '');

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

  function setQuickAmount(pounds: number) {
    setTopUpAmount(pounds.toString());
  }

  async function handleTopUp() {
    setError('');
    setSuccessMessage('');
    
    const amountPounds = parseInt(topUpAmount);
    
    // Validate amount
    if (!amountPounds || amountPounds < 1) {
      setError('Please enter a valid amount (minimum £1)');
      return;
    }
    
    if (amountPounds > 10000) {
      setError('Maximum top-up amount is £10,000');
      return;
    }
    
    const amountCents = amountPounds * 100;
    
    setIsTopUpLoading(true);
    
    try {
      // Call create-checkout-session API (auth via cookies)
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      
      const data = await response.json();
      
      if (response.status === 403 && data.mode === 'demo') {
        // Stripe not configured - show demo modal
        setDemoAmount(amountCents);
        setShowDemoModal(true);
        setIsTopUpLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error('No session URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate top-up');
      setIsTopUpLoading(false);
    }
  }
  
  async function handleDemoConfirm() {
    setError('');
    setIsTopUpLoading(true);
    
    try {
      // Call demo-simulate API (auth via cookies)
      const response = await fetch('/api/stripe/demo-simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount_cents: demoAmount }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Demo simulation failed');
      }
      
      // Redirect to success page
      window.location.href = '/wallet?status=success-demo';
    } catch (err: any) {
      setError(err.message || 'Demo simulation failed');
      setIsTopUpLoading(false);
      setShowDemoModal(false);
    }
  }
  
  function handleDemoCancel() {
    setShowDemoModal(false);
    setIsTopUpLoading(false);
    setDemoAmount(0);
  }

  async function handleWithdrawRequest() {
    if (!withdrawAmount) return;
    
    const amountCents = Math.floor(parseFloat(withdrawAmount) * 100);
    
    if (amountCents < 500) {
      setError('Minimum withdrawal is £5');
      return;
    }
    
    if (amountCents > balance) {
      setError('Insufficient balance');
      return;
    }
    
    setIsWithdrawLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/wallet/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_cents: amountCents }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Withdrawal request failed');
      }
      
      setSuccessMessage('Withdrawal request submitted! We will process it shortly.');
      setWithdrawAmount('');
      loadWallet(); // Reload to show pending withdrawal
    } catch (err: any) {
      setError(err.message || 'Withdrawal request failed');
    } finally {
      setIsWithdrawLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          Loading wallet...
        </div>
      </>
    );
  }

  return (
    <>
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
        </div>

        {/* Top Up Section */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem' }}>
            Top Up Wallet
          </h2>

          {/* Quick Amount Buttons */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>
              Quick amounts
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {[5, 10, 20, 50].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setQuickAmount(amount)}
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: topUpAmount === amount.toString() ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.05)',
                    border: topUpAmount === amount.toString() ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (topUpAmount !== amount.toString()) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (topUpAmount !== amount.toString()) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }
                  }}
                >
                  £{amount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              color: 'rgba(255,255,255,0.6)', 
              marginBottom: '0.5rem' 
            }}>
              Or enter custom amount (£)
            </label>
            <input
              type="number"
              min="1"
              max="10000"
              step="1"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Enter amount in pounds"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
              Minimum £1, maximum £10,000
            </div>
          </div>

          {/* Top Up Button */}
          <button
            onClick={handleTopUp}
            disabled={isTopUpLoading || !topUpAmount}
            style={{
              width: '100%',
              padding: '1rem',
              background: isTopUpLoading || !topUpAmount ? 'rgba(102, 126, 234, 0.3)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isTopUpLoading || !topUpAmount ? 'not-allowed' : 'pointer',
              opacity: isTopUpLoading || !topUpAmount ? 0.6 : 1,
            }}
          >
            {isTopUpLoading ? 'Processing...' : '💳 Top Up Wallet'}
          </button>
        </div>

        {/* Withdraw Section */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '1.5rem' }}>
            Request Withdrawal
          </h2>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
              Amount (£)
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => {
                setWithdrawAmount(e.target.value);
                setError('');
              }}
              placeholder="Minimum £5"
              min="5"
              max={balance / 100}
              step="1"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.5rem' }}>
              Available: {formatPounds(balance)}
            </div>
          </div>

          <button
            onClick={handleWithdrawRequest}
            disabled={isWithdrawLoading || !withdrawAmount}
            style={{
              width: '100%',
              padding: '1rem',
              background: isWithdrawLoading || !withdrawAmount ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: isWithdrawLoading || !withdrawAmount ? 'not-allowed' : 'pointer',
              opacity: isWithdrawLoading || !withdrawAmount ? 0.6 : 1,
            }}
          >
            {isWithdrawLoading ? 'Processing...' : '💷 Request Withdrawal'}
          </button>

          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '1rem' }}>
            Withdrawals are reviewed by our team and typically processed within 1-2 business days.
          </div>
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

        {successMessage && (
          <div style={{
            background: 'rgba(102, 234, 158, 0.1)',
            border: '1px solid rgba(102, 234, 158, 0.3)',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1.5rem',
            color: '#66ea9e',
            fontSize: '0.875rem',
          }}>
            ✓ {successMessage}
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

        {/* Demo Modal */}
        {showDemoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #0a0f1c 0%, #1a2332 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
            }}>
              <div style={{
                display: 'inline-block',
                background: 'rgba(255, 193, 7, 0.15)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#ffc107',
                marginBottom: '1.5rem',
              }}>
                ⚠️ DEMO MODE
              </div>

              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                Demo Stripe — No payment taken
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                Stripe is not configured on this server. This is a simulation for testing purposes.
              </p>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                    Amount
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                    {formatPounds(demoAmount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
                    Email
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                    {userEmail}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleDemoCancel}
                  disabled={isTopUpLoading}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isTopUpLoading ? 'not-allowed' : 'pointer',
                    opacity: isTopUpLoading ? 0.5 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDemoConfirm}
                  disabled={isTopUpLoading}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: isTopUpLoading ? 'rgba(102, 126, 234, 0.3)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: isTopUpLoading ? 'not-allowed' : 'pointer',
                    opacity: isTopUpLoading ? 0.6 : 1,
                  }}
                >
                  {isTopUpLoading ? 'Processing...' : 'Confirm demo payment'}
                </button>
              </div>
            </div>
          </div>
        )}
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
