'use client';

import { useRouter } from 'next/navigation';
import styles from './insufficient-funds-modal.module.css';

interface InsufficientFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  requiredAmount: number;
}

export default function InsufficientFundsModal({
  isOpen,
  onClose,
  currentBalance,
  requiredAmount,
}: InsufficientFundsModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const shortfall = requiredAmount - currentBalance;

  const goToWallet = () => {
    router.push('/wallet');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          💰
        </div>
        
        <h2 className={styles.title}>Ready to Play?</h2>
        
        <p className={styles.message}>
          Let's top up your wallet so you can join this exciting tournament!
        </p>

        <div className={styles.balanceInfo}>
          <div className={styles.balanceRow}>
            <span className={styles.label}>Your Balance:</span>
            <span className={styles.amount}>£{(currentBalance / 100).toFixed(2)}</span>
          </div>
          <div className={styles.balanceRow}>
            <span className={styles.label}>Entry Fee:</span>
            <span className={styles.amount}>£{(requiredAmount / 100).toFixed(2)}</span>
          </div>
          <div className={`${styles.balanceRow} ${styles.shortfall}`}>
            <span className={styles.label}>Top up needed:</span>
            <span className={styles.amount}>£{(shortfall / 100).toFixed(2)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={onClose} className={styles.cancelBtn}>
            ← Go Back
          </button>
          <button onClick={goToWallet} className={styles.topUpBtn}>
            ⚡ Top Up Now
          </button>
        </div>
      </div>
    </div>
  );
}
