'use client';

import { useRouter } from 'next/navigation';
import styles from './purchase-success-modal.module.css';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export default function PurchaseSuccessModal({
  isOpen,
  amount,
  onClose,
}: PurchaseSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const viewScorecards = () => {
    router.push('/entries');
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.iconContainer}>
          ✓
        </div>
        
        <h2 className={styles.title}>Purchase Successful!</h2>
        
        <p className={styles.message}>
          Your scorecard has been purchased and £{(amount / 100).toFixed(2)} has been deducted from your balance.
        </p>

        <div className={styles.actions}>
          <button onClick={viewScorecards} className={styles.primaryBtn}>
            View My Scorecards
          </button>
        </div>
      </div>
    </div>
  );
}
