import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const adminClient = createAdminClient();
  
  // Total users count
  const { count: totalUsers } = await adminClient
    .from('profiles')
    .select('*', { count: 'exact', head: true });
  
  // Total balance sum
  const { data: walletData } = await adminClient
    .from('wallets')
    .select('balance_cents');
  
  const totalBalanceCents = walletData?.reduce((sum, w) => sum + (w.balance_cents || 0), 0) || 0;
  
  // Pending withdrawals count
  const { count: pendingWithdrawals } = await adminClient
    .from('withdrawal_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  // Today's transactions count
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { count: todayTxCount } = await adminClient
    .from('wallet_transactions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', today.toISOString());
  
  return {
    totalUsers: totalUsers || 0,
    totalBalancePounds: (totalBalanceCents / 100).toFixed(2),
    pendingWithdrawals: pendingWithdrawals || 0,
    todayTxCount: todayTxCount || 0,
  };
}

export default async function DashboardPage() {
  await assertAdminOrRedirect();
  const stats = await getDashboardStats();
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1.5rem',
          background: '#fff',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Total Users
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {stats.totalUsers}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: '#fff',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Total Balance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            £{stats.totalBalancePounds}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: '#fff',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Pending Withdrawals
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600, color: '#f59e0b' }}>
            {stats.pendingWithdrawals}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: '#fff',
          border: '1px solid #eaeaea',
          borderRadius: '8px',
        }}>
          <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
            Today's Transactions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 600 }}>
            {stats.todayTxCount}
          </div>
        </div>
      </div>
    </div>
  );
}
