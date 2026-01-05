'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './confirmed.module.css';

function EntryConfirmedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(10);
  
  const competitionName = searchParams.get('name') || 'Competition';
  const entryCredits = searchParams.get('credits') || '0';

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Separate effect for navigation when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      router.push('/clubhouse/my-entries');
    }
  }, [countdown, router]);

  return (
    <div className={styles.container}>
      <div className={styles.confirmationCard}>
        {/* Success Icon */}
        <div className={styles.iconWrapper}>
          <div className={styles.successIcon}>✓</div>
        </div>

        {/* Heading */}
        <h1 className={styles.title}>Entry Confirmed!</h1>
        <p className={styles.subtitle}>
          Your scorecard has been successfully submitted
        </p>

        {/* Competition Details */}
        <div className={styles.detailsBox}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Competition:</span>
            <span className={styles.value}>{competitionName}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Entry Fee:</span>
            <span className={styles.value}>{entryCredits} Credits</span>
          </div>
        </div>

        {/* Success Message */}
        <div className={styles.messageBox}>
          <p className={styles.message}>
            🎉 Good luck! Your team has been locked in and you're ready to compete.
          </p>
          <p className={styles.message}>
            Track your progress and view live scores in your entries dashboard.
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.buttonGroup}>
          <Link href="/clubhouse/my-entries" className={styles.primaryButton}>
            View My Entries
          </Link>
          <Link href="/clubhouse" className={styles.secondaryButton}>
            Back to Clubhouse
          </Link>
        </div>

        {/* Auto-redirect Countdown */}
        <p className={styles.countdown}>
          Redirecting to My Entries in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

export default function EntryConfirmedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EntryConfirmedContent />
    </Suspense>
  );
}
