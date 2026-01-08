'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { createClient } from '@/lib/supabaseClient';
import styles from './reserve-place.module.css';

interface Competition {
  id: string;
  tournament_id: string;
  entry_fee_pennies: number;
  status: string;
  competition_types: {
    name: string;
    slug: string;
  };
  tournaments: {
    name: string;
    slug: string;
    location: string | null;
    start_date: string;
    end_date: string;
  };
}

export default function ReservePlacePage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const supabase = createClient();

  useEffect(() => {
    fetchCompetitionAndBalance();
  }, [competitionId]);

  const fetchCompetitionAndBalance = async () => {
    try {
      // Get competition details
      const { data: compData, error: compError } = await supabase
        .from('tournament_competitions')
        .select(`
          id,
          tournament_id,
          entry_fee_pennies,
          status,
          competition_types (
            name,
            slug
          ),
          tournaments (
            name,
            slug,
            location,
            start_date,
            end_date
          )
        `)
        .eq('id', competitionId)
        .single();

      if (compError || !compData) {
        setError('Competition not found');
        setLoading(false);
        return;
      }

      setCompetition(compData as any);

      // Get user balance
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: wallet } = await supabase
          .from('wallets')
          .select('balance_cents')
          .eq('user_id', user.id)
          .single();
        
        if (wallet) {
          setBalance(wallet.balance_cents);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    if (!competition) return;

    setReserving(true);
    setError(null);

    try {
      // Create reservation entry with pending status
      const res = await fetch(`/api/competitions/${competition.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reserve place');
      }

      // Redirect to entries page with success message
      router.push(`/entries?reserved=${competition.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setReserving(false);
    }
  };

  const formatCurrency = (pennies: number) => {
    const pounds = pennies / 100;
    return `£${pounds.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Competition Not Found</h2>
        <p>{error || 'The competition you are looking for does not exist.'}</p>
        <Link href="/tournaments" className={styles.backButton}>
          <i className="fas fa-arrow-left"></i>
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const hasSufficientFunds = balance >= competition.entry_fee_pennies;

  return (
    <RequireAuth>
      <div className={styles.container}>
        {/* Background Animation */}
        <div className={styles.backgroundAnimation}>
          <div className={styles.gradientOrb1}></div>
          <div className={styles.gradientOrb2}></div>
        </div>

        {/* Header */}
        <div className={styles.header}>
          <Link href={`/tournaments/${competition.tournaments.slug}`} className={styles.backButton}>
            <i className="fas fa-arrow-left"></i>
            Back to Tournament
          </Link>
        </div>

        {/* Main Content */}
        <div className={styles.content}>
          <div className={`${styles.card} ${styles.glass}`}>
            {/* Icon */}
            <div className={styles.iconContainer}>
              <i className="fas fa-bookmark"></i>
            </div>

            {/* Title */}
            <h1 className={styles.title}>Reserve Your Place</h1>
            <p className={styles.subtitle}>Golfer lineup coming soon</p>

            {/* Competition Details */}
            <div className={styles.details}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-trophy"></i>
                  Tournament
                </span>
                <span className={styles.detailValue}>{competition.tournaments.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-flag-checkered"></i>
                  Competition
                </span>
                <span className={styles.detailValue}>{competition.competition_types.name}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-calendar-alt"></i>
                  Tournament Dates
                </span>
                <span className={styles.detailValue}>
                  {formatDate(competition.tournaments.start_date)} - {formatDate(competition.tournaments.end_date)}
                </span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>
                  <i className="fas fa-ticket-alt"></i>
                  Entry Fee
                </span>
                <span className={styles.detailValue}>{formatCurrency(competition.entry_fee_pennies)}</span>
              </div>
            </div>

            {/* Info Box */}
            <div className={styles.infoBox}>
              <i className="fas fa-info-circle"></i>
              <div>
                <h3>What happens next?</h3>
                <ul>
                  <li>Your entry fee will be deducted from your wallet</li>
                  <li>Your place will be reserved in this competition</li>
                  <li>Once the golfer lineup is announced, you can build your team</li>
                  <li>You'll receive a notification when golfers are available</li>
                </ul>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>
                <i className="fas fa-wallet"></i>
                Your Balance
              </span>
              <span className={styles.balanceValue} style={{ 
                color: hasSufficientFunds ? '#10b981' : '#ef4444' 
              }}>
                {formatCurrency(balance)}
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            {/* Insufficient Funds Warning */}
            {!hasSufficientFunds && (
              <div className={styles.warningMessage}>
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Insufficient funds</strong>
                  <p>Please top up your wallet to reserve your place</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className={styles.actions}>
              {hasSufficientFunds ? (
                <button 
                  className={styles.btnReserve}
                  onClick={handleReserve}
                  disabled={reserving}
                >
                  {reserving ? (
                    <>
                      <div className={styles.btnSpinner}></div>
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-bookmark"></i>
                      <span>Reserve My Place - {formatCurrency(competition.entry_fee_pennies)}</span>
                    </>
                  )}
                </button>
              ) : (
                <Link href="/wallet" className={styles.btnTopUp}>
                  <i className="fas fa-plus-circle"></i>
                  <span>Top Up Wallet</span>
                </Link>
              )}
              
              <Link 
                href={`/tournaments/${competition.tournaments.slug}`} 
                className={styles.btnCancel}
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
