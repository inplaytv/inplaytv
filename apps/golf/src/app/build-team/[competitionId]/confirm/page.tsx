'use client';

import { useState, useEffect } from 'react';
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

export default function ConfirmLineupPage({ params }: { params: { competitionId: string } }) {
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
      const storedLineup = sessionStorage.getItem(`lineup_${params.competitionId}`);
      if (!storedLineup) {
        throw new Error('No lineup data found. Please build your team first.');
      }
      const lineup: LineupData = JSON.parse(storedLineup);
      setLineupData(lineup);

      // Fetch competition details
      const compRes = await fetch(`/api/competitions/${params.competitionId}`);
      if (!compRes.ok) throw new Error('Failed to load competition');
      const compData = await compRes.json();
      setCompetition(compData);

      // Fetch golfers to display names
      const golfersRes = await fetch(`/api/competitions/${params.competitionId}/golfers`);
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

      const res = await fetch(`/api/competitions/${params.competitionId}/entries`, {
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
      sessionStorage.removeItem(`lineup_${params.competitionId}`);

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
    return `£${(pennies / 100).toLocaleString()}`;
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
      <div className={styles.container}>
        <div className={styles.confirmCard}>
          <div className={styles.cardHeader}>
            <h1>Confirm Your Scorecard</h1>
            <p className={styles.subtitle}>Review your lineup before purchase</p>
          </div>

          {/* Competition Info */}
          <div className={styles.infoSection}>
            <h2>{competition.tournament_name}</h2>
            <p className={styles.compType}>{competition.competition_type_name}</p>
          </div>

          {/* Team Name */}
          {lineupData.entry_name && (
            <div className={styles.teamName}>
              <i className="fas fa-users"></i>
              <span>{lineupData.entry_name}</span>
            </div>
          )}

          {/* Lineup */}
          <div className={styles.lineup}>
            <h3>Your Lineup</h3>
            <div className={styles.golfersList}>
              {selectedGolfers.map((pick) => (
                <div key={pick.golfer_id} className={styles.golferRow}>
                  <div className={styles.golferLeft}>
                    <span className={styles.position}>#{pick.slot_position}</span>
                    <div className={styles.golferInfo}>
                      <span className={styles.golferName}>{pick.golfer?.full_name || 'Unknown'}</span>
                      {pick.golfer?.world_ranking && (
                        <span className={styles.ranking}>Rank #{pick.golfer.world_ranking}</span>
                      )}
                    </div>
                    {pick.golfer_id === lineupData.captain_golfer_id && (
                      <span className={styles.captainBadge}>
                        <i className="fas fa-crown"></i> Captain (2x points)
                      </span>
                    )}
                  </div>
                  <span className={styles.salary}>£{pick.salary_at_selection.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className={styles.total}>
              <span>Total Salary Used:</span>
              <strong>£{lineupData.total_salary.toLocaleString()} / £50,000</strong>
            </div>
          </div>

          {/* Balance & Entry Fee */}
          <div className={styles.payment}>
            <div className={styles.balanceRow}>
              <span>Your Wallet Balance:</span>
              <strong className={insufficientFunds ? styles.insufficient : ''}>
                {formatCurrency(userBalance)}
              </strong>
            </div>
            <div className={styles.feeRow}>
              <span>Entry Fee:</span>
              <strong>{formatCurrency(competition.entry_fee_pennies)}</strong>
            </div>
            {!insufficientFunds && (
              <div className={styles.remainingRow}>
                <span>Remaining Balance:</span>
                <strong>{formatCurrency(userBalance - competition.entry_fee_pennies)}</strong>
              </div>
            )}
          </div>

          {insufficientFunds && (
            <div className={styles.warning}>
              <i className="fas fa-exclamation-circle"></i>
              <span>Insufficient funds. Please add money to your wallet to continue.</span>
            </div>
          )}

          {error && (
            <div className={styles.errorBanner}>
              <i className="fas fa-times-circle"></i>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button onClick={goBack} className={styles.cancelBtn} disabled={submitting}>
              <i className="fas fa-arrow-left"></i>
              Go Back
            </button>
            <button 
              onClick={confirmPurchase} 
              className={styles.confirmBtn}
              disabled={submitting || insufficientFunds}
            >
              <i className="fas fa-check-circle"></i>
              {submitting ? 'Processing...' : 'Confirm & Purchase'}
            </button>
          </div>
        </div>
      </div>
      
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        amount={competition?.entry_fee_pennies || 0}
        onClose={() => {
          setShowSuccessModal(false);
          // Force a full page reload to refresh balance and entries
          window.location.href = '/entries';
        }}
      />
    </RequireAuth>
  );
}
