'use client';

import { useState } from 'react';

interface WithdrawalActionsProps {
  id: number;
  status: string;
}

export default function WithdrawalActions({ id, status }: WithdrawalActionsProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    if (loading) return;
    
    const confirmed = confirm(`Are you sure you want to ${newStatus} this withdrawal?`);
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await fetch('/api/admin/withdrawals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: id,
          new_status: newStatus,
          note: note || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update withdrawal');
      }

      alert(`Withdrawal ${newStatus} successfully`);
      window.location.reload();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (status === 'paid' || status === 'rejected' || status === 'cancelled') {
    return (
      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
        Processed
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      {status === 'pending' && (
        <>
          <button
            onClick={() => handleStatusChange('approved')}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Approve
          </button>
          <button
            onClick={() => handleStatusChange('rejected')}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Reject
          </button>
        </>
      )}
      
      {status === 'approved' && (
        <>
          <button
            onClick={() => setShowNote(showNote ? null : 'paid')}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Mark Paid
          </button>
          {showNote === 'paid' && (
            <div style={{ width: '100%', marginTop: '0.5rem' }}>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (transaction ID, etc.)"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem',
                }}
              />
              <button
                onClick={() => handleStatusChange('paid')}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginRight: '0.5rem',
                }}
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowNote(null);
                  setNote('');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
