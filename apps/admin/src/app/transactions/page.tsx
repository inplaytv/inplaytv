import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

async function getTransactions(filters?: { type?: string; date_from?: string }) {
  const adminClient = createAdminClient();
  
  let query = adminClient
    .from('ledger_overview')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (filters?.type) {
    query = query.eq('source', filters.type);
  }
  
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return data || [];
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { type?: string; date_from?: string };
}) {
  await assertAdminOrRedirect();
  const transactions = await getTransactions(searchParams);
  
  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 700 }}>Transactions</h1>
      
      <form method="GET" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
        <select
          name="type"
          defaultValue={searchParams.type || ''}
          style={{
            padding: '0.7rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            fontSize: '0.9rem',
            color: '#fff',
            outline: 'none',
          }}
        >
          <option value="">All types</option>
          <option value="tx">Transactions</option>
          <option value="external">External payments</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </form>
      
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
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Date</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Type</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Reason</th>
              <th style={{ padding: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Amount</th>
              <th style={{ padding: '0.875rem', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.9)', fontSize: '0.8rem' }}>Ref</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={`${tx.source}-${tx.ref_id}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.875rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' }}>
                  {new Date(tx.created_at).toLocaleString('en-GB')}
                </td>
                <td style={{ padding: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>
                  <span style={{ fontSize: '0.8rem' }}>{tx.source}</span>
                </td>
                <td style={{ padding: '0.875rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                  {tx.reason}
                </td>
                <td style={{
                  padding: '0.875rem',
                  textAlign: 'right',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: tx.amount_cents >= 0 ? '#10b981' : '#ef4444',
                }}>
                  {tx.amount_cents >= 0 ? '+' : ''}£{(tx.amount_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '0.875rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
                  {tx.ref_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
}
