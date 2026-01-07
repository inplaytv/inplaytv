'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import PurchaseSuccessModal from '@/components/PurchaseSuccessModal';
import styles from './confirm.module.css';

interface Golfer {
  id: string;
  full_name: string;
  world_ranking: number | null;
  salary: number;
}

interface LineupData {
  picks: Array<{
    golfer_id: string;
    slot_position: number;
    salary_at_selection: number;
  }>;
  captain_golfer_id: string;
  entry_name: string | null;
  total_salary: number;
}

interface Competition {
  id: string;
  tournament_name: string;
  competition_type_name: string;
  entry_fee_pennies: number;
}

export default function ConfirmLineupPage({ params }: { params: Promise<{ competitionId: string }> }) {
  const { competitionId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [lineupData, setLineupData] = useState<LineupData | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadConfirmationData();
  }, []);

  async function loadConfirmationData() {
    try {
      setLoading(true);
      
      // Get lineup data from sessionStorage
      const storedLineup = sessionStorage.getItem(`lineup_${competitionId}`);
      if (!storedLineup) {
        throw new Error('No lineup data found. Please build your team first.');
      }
      const lineup: LineupData = JSON.parse(storedLineup);
      setLineupData(lineup);

      // Fetch competition details
      const compRes = await fetch(`/api/competitions/${competitionId}`);
      if (!compRes.ok) throw new Error('Failed to load competition');
      const compData = await compRes.json();
      setCompetition(compData);

      // Fetch golfers to display names
      const golfersRes = await fetch(`/api/competitions/${competitionId}/golfers`);
      if (!golfersRes.ok) throw new Error('Failed to load golfers');
      const golfersData: Golfer[] = await golfersRes.json();
      setGolfers(golfersData);

      // Fetch user balance
      const balanceRes = await fetch('/api/user/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setUserBalance(balanceData.balance_pennies || 0);
        
        // Check if user has sufficient funds
        if (balanceData.balance_pennies < compData.entry_fee_pennies) {
          setInsufficientFunds(true);
        }
      }

    } catch (err: any) {
      console.error('Failed to load confirmation data:', err);
      setError(err.message || 'Failed to load confirmation data');
    } finally {
      setLoading(false);
    }
  }

  async function confirmPurchase() {
    if (insufficientFunds) {
      alert('Insufficient funds. Please add money to your wallet.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      console.log('🛒 Starting purchase...', lineupData);

      const payload = {
        ...lineupData,
        status: 'submitted',
      };

      console.log('📤 Sending purchase request:', payload);

      const res = await fetch(`/api/competitions/${competitionId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', res.status, res.ok);

      if (!res.ok) {
        const errData = await res.json();
        console.error('❌ Purchase failed:', errData);
        throw new Error(errData.error || 'Failed to purchase scorecard');
      }

      const result = await res.json();
      console.log('✅ Purchase successful:', result);

      // Clear stored lineup
      sessionStorage.removeItem(`lineup_${competitionId}`);

      // Show success modal
      setShowSuccessModal(true);

    } catch (err: any) {
      console.error('❌ Purchase error:', err);
      setError(err.message || 'Failed to purchase scorecard');
      alert(err.message || 'Failed to purchase scorecard');
    } finally {
      setSubmitting(false);
    }
  }

  function goBack() {
    router.back();
  }

  const formatCurrency = (pennies: number) => {
    return `£${Math.floor(pennies / 100).toLocaleString()}`;
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading confirmation...</p>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error || !lineupData || !competition) {
    return (
      <RequireAuth>
        <div className={styles.container}>
          <div className={styles.error}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>{error || 'Failed to load confirmation data'}</p>
            <button onClick={goBack} className={styles.backBtn}>
              Go Back
            </button>
          </div>
        </div>
      </RequireAuth>
    );
  }

  const captain = golfers.find(g => g.id === lineupData.captain_golfer_id);
  const selectedGolfers = lineupData.picks
    .map(pick => ({
      ...pick,
      golfer: golfers.find(g => g.id === pick.golfer_id)
    }))
    .sort((a, b) => a.slot_position - b.slot_position);

  return (
    <RequireAuth>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '40px',
        minHeight: '100vh'
      }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Left Column: Purchase Details */}
          <div style={{
            padding: '24px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.18)',
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Competition Info */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#10b981', margin: '0 0 4px 0' }}>
                {competition.tournament_name}
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {competition.competition_type_name}
              </p>
            </div>

            {/* Team Name */}
            {lineupData.entry_name && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-users" style={{ color: '#3b82f6', fontSize: '14px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {lineupData.entry_name}
                </span>
              </div>
            )}

            {/* Lineup */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fbbf24', margin: 0 }}>
                  Your Lineup
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Review your lineup before purchase
                </p>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {selectedGolfers.map((pick) => (
                  <div key={pick.golfer_id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: pick.golfer_id === lineupData.captain_golfer_id 
                      ? 'rgba(251, 191, 36, 0.1)' 
                      : 'rgba(255,255,255,0.03)',
                    border: pick.golfer_id === lineupData.captain_golfer_id
                      ? '1px solid rgba(251, 191, 36, 0.3)'
                      : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                          #{pick.slot_position}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                          {pick.golfer?.full_name || 'Unknown'}
                        </span>
                        {pick.golfer_id === lineupData.captain_golfer_id && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            background: '#fbbf24',
                            color: 'black',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            CAPTAIN
                          </span>
                        )}
                      </div>
                      {pick.golfer?.world_ranking && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          Rank #{pick.golfer.world_ranking}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
                      £{Math.floor(pick.salary_at_selection / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Details */}
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Your Wallet Balance:</span>
                <strong style={{ 
                  fontSize: '14px', 
                  color: insufficientFunds ? '#ef4444' : '#10b981'
                }}>
                  {formatCurrency(userBalance)}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Entry Fee:</span>
                <strong style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)' }}>
                  {formatCurrency(competition.entry_fee_pennies)}
                </strong>
              </div>
              {!insufficientFunds && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>Remaining Balance:</span>
                  <strong style={{ fontSize: '14px', color: '#3b82f6' }}>
                    {formatCurrency(userBalance - competition.entry_fee_pennies)}
                  </strong>
                </div>
              )}
            </div>

            {insufficientFunds && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-exclamation-circle" style={{ color: '#ef4444' }}></i>
                <span style={{ fontSize: '12px', color: '#ef4444' }}>
                  Insufficient funds. Please add money to your wallet to continue.
                </span>
              </div>
            )}

            {error && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="fas fa-times-circle" style={{ color: '#ef4444' }}></i>
                <span style={{ fontSize: '12px', color: '#ef4444' }}>{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={goBack}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.9)',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                }}
                onMouseLeave={(e) => {
                  if (!submitting) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                }}
              >
                <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                Go Back
              </button>
              <button
                onClick={confirmPurchase}
                disabled={submitting || insufficientFunds}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  background: (!submitting && !insufficientFunds) ? '#10b981' : '#6b7280',
                  border: 'none',
                  color: 'white',
                  cursor: (!submitting && !insufficientFunds) ? 'pointer' : 'not-allowed',
                  opacity: (!submitting && !insufficientFunds) ? 1 : 0.6,
                  boxShadow: (!submitting && !insufficientFunds) ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!submitting && !insufficientFunds) {
                    e.currentTarget.style.background = '#059669';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitting && !insufficientFunds) {
                    e.currentTarget.style.background = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }
                }}
              >
                <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                {submitting ? 'Processing...' : 'Confirm & Purchase'}
              </button>
            </div>
          </div>

          {/* Right Column: Advertising Containers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Ad Container 1 - Premium Golf Gear */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
            }}
            onClick={() => window.open('https://example.com/golf-gear', '_blank')}
            >
              <img 
                src="/ads/ad-slot-1.svg" 
                alt="Premium Golf Gear Advertisement" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Ad Container 2 - Book Tee Times */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
            }}
            onClick={() => window.open('https://example.com/tee-times', '_blank')}
            >
              <img 
                src="/ads/ad-slot-2.svg" 
                alt="Book Tee Times Advertisement" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>

            {/* Ad Container 3 - Smart Golf Tech */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.18)',
              borderRadius: '16px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
            }}
            onClick={() => window.open('https://example.com/golf-tech', '_blank')}
            >
              <img 
                src="/ads/ad-slot-3.svg" 
                alt="Smart Golf Technology Advertisement" 
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        amount={competition?.entry_fee_pennies || 0}
        onClose={() => {
          setShowSuccessModal(false);
          window.location.href = '/entries';
        }}
      />
    </RequireAuth>
  );
}
