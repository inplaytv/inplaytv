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
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', fontWeight: 700 }}>Dashboard</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}>
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
            Total Users
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6' }}>
            {stats.totalUsers}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
            Total Balance
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#10b981' }}>
            £{stats.totalBalancePounds}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
            Pending Withdrawals
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f59e0b' }}>
            {stats.pendingWithdrawals}
          </div>
        </div>
        
        <div style={{
          padding: '1.5rem',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>
            Today's Transactions
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#8b5cf6' }}>
            {stats.todayTxCount}
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '1.5rem',
        background: 'rgba(59, 130, 246, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '12px',
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          ℹ️ Quick Actions
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1rem' }}>
          Navigate to sections above to manage users, transactions, and withdrawal requests.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a 
            href="/withdrawals" 
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            View Pending Withdrawals
          </a>
          <a 
            href="/users" 
            style={{
              padding: '0.75rem 1.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}
