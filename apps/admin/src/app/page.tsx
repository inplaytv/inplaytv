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
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 700 }}>Dashboard</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Users
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
            {stats.totalUsers}
          </div>
        </div>
        
        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Balance
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
            £{stats.totalBalancePounds}
          </div>
        </div>
        
        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Pending Withdrawals
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
            {stats.pendingWithdrawals}
          </div>
        </div>
        
        <div style={{
          padding: '1.25rem',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Today's Transactions
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8b5cf6' }}>
            {stats.todayTxCount}
          </div>
        </div>
      </div>
      
      <div style={{
        padding: '1.25rem',
        background: 'rgba(59, 130, 246, 0.05)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: '10px',
        backdropFilter: 'blur(10px)',
      }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Quick Actions
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Navigate to sections above to manage users, transactions, and withdrawal requests.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a 
            href="/withdrawals" 
            style={{
              padding: '0.65rem 1.25rem',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
              fontSize: '0.85rem',
            }}
          >
            View Pending Withdrawals
          </a>
          <a 
            href="/users" 
            style={{
              padding: '0.65rem 1.25rem',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              display: 'inline-block',
              fontSize: '0.85rem',
            }}
          >
            Manage Users
          </a>
        </div>
      </div>
    </div>
  );
}
