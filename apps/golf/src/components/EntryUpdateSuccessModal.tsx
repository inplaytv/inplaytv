'use client';

import { useRouter } from 'next/navigation';
import styles from './purchase-success-modal.module.css'; // Reuse same styles

interface EntryUpdateSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EntryUpdateSuccessModal({
  isOpen,
  onClose,
}: EntryUpdateSuccessModalProps) {
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
        
        <h2 className={styles.title}>Entry Updated Successfully!</h2>
        
        <p className={styles.message}>
          Your lineup has been saved. You can continue editing or view all your entries.
        </p>

        <div className={styles.actions}>
          <button onClick={viewScorecards} className={styles.primaryBtn}>
            View My Entries
          </button>
          <button onClick={onClose} className={styles.secondaryBtn}>
            Continue Editing
          </button>
        </div>
      </div>
    </div>
  );
}
