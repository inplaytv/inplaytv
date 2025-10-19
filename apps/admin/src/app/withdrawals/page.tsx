import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import WithdrawalActions from '@/components/WithdrawalActions';

export const dynamic = 'force-dynamic';

interface WithdrawalRequest {
  id: number;
  user_id: string;
  amount_cents: number;
  status: string;
  requested_at: string;
  processed_by: string | null;
  processed_at: string | null;
  note: string | null;
  user_email?: string;
}

async function getWithdrawals() {
  const adminClient = createAdminClient();
  
  const { data: withdrawals, error } = await adminClient
    .from('withdrawal_requests')
    .select(`
      *,
      profiles:user_id (name)
    `)
    .order('requested_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching withdrawals:', error);
    return [];
  }
  
  // Get user emails from auth.users
  const userIds = withdrawals?.map(w => w.user_id) || [];
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  
  const userEmailMap = new Map(users?.map(u => [u.id, u.email]) || []);
  
  return withdrawals?.map(w => ({
    ...w,
    user_email: userEmailMap.get(w.user_id) || 'Unknown',
  })) || [];
}

export default async function WithdrawalsPage() {
  await assertAdminOrRedirect();
  const withdrawals = await getWithdrawals();
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#3b82f6';
      case 'paid': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#6b7280';
      default: return 'rgba(255,255,255,0.6)';
    }
  };
  
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 700 }}>Withdrawal Requests</h1>
      
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>ID</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>User</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Amount</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Status</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Requested</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem' }}>{withdrawal.id}</td>
                <td style={{ padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    {withdrawal.user_email}
                  </div>
                </td>
                <td style={{ padding: '0.875rem', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                  £{(withdrawal.amount_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '0.875rem' }}>
                  <span style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    background: `${statusColor(withdrawal.status)}20`,
                    color: statusColor(withdrawal.status),
                  }}>
                    {withdrawal.status}
                  </span>
                </td>
                <td style={{ padding: '0.875rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                  {new Date(withdrawal.requested_at).toLocaleString('en-GB')}
                </td>
                <td style={{ padding: '0.875rem' }}>
                  <WithdrawalActions id={withdrawal.id} status={withdrawal.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {withdrawals.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            No withdrawal requests yet
          </div>
        )}
      </div>
    </div>
  );
}
