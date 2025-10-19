import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

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
      default: return '#666';
    }
  };
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Withdrawal Requests</h1>
      
      <div style={{
        background: '#fff',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>ID</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Requested</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: '1rem' }}>{withdrawal.id}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    {withdrawal.user_email}
                  </div>
                </td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>
                  £{(withdrawal.amount_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    background: `${statusColor(withdrawal.status)}20`,
                    color: statusColor(withdrawal.status),
                  }}>
                    {withdrawal.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  {new Date(withdrawal.requested_at).toLocaleString('en-GB')}
                </td>
                <td style={{ padding: '1rem' }}>
                  {withdrawal.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <form action="/api/admin/withdrawals/update" method="POST" style={{ display: 'inline' }}>
                        <input type="hidden" name="request_id" value={withdrawal.id} />
                        <input type="hidden" name="action" value="approved" />
                        <button type="submit" style={{
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}>
                          Approve
                        </button>
                      </form>
                      <form action="/api/admin/withdrawals/update" method="POST" style={{ display: 'inline' }}>
                        <input type="hidden" name="request_id" value={withdrawal.id} />
                        <input type="hidden" name="action" value="rejected" />
                        <button type="submit" style={{
                          padding: '0.5rem 1rem',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                        }}>
                          Reject
                        </button>
                      </form>
                    </div>
                  )}
                  {withdrawal.status === 'approved' && (
                    <form action="/api/admin/withdrawals/update" method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="request_id" value={withdrawal.id} />
                      <input type="hidden" name="action" value="paid" />
                      <button type="submit" style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}>
                        Mark Paid
                      </button>
                    </form>
                  )}
                  {['paid', 'rejected'].includes(withdrawal.status) && (
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {withdrawals.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No withdrawal requests yet
          </div>
        )}
      </div>
    </div>
  );
}
