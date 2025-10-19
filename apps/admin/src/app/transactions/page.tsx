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
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Transactions</h1>
      
      <form method="GET" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <select
          name="type"
          defaultValue={searchParams.type || ''}
          style={{
            padding: '0.75rem',
            border: '1px solid #eaeaea',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        >
          <option value="">All types</option>
          <option value="tx">Transactions</option>
          <option value="external">External payments</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
      </form>
      
      <div style={{
        background: '#fff',
        border: '1px solid #eaeaea',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Date</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Type</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Reason</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Amount</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Ref</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, idx) => (
              <tr key={`${tx.source}-${tx.ref_id}-${idx}`} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                  {new Date(tx.created_at).toLocaleString('en-GB')}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>{tx.source}</span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  {tx.reason}
                </td>
                <td style={{
                  padding: '1rem',
                  textAlign: 'right',
                  fontWeight: 500,
                  color: tx.amount_cents >= 0 ? '#10b981' : '#ef4444',
                }}>
                  {tx.amount_cents >= 0 ? '+' : ''}£{(tx.amount_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.75rem', color: '#999' }}>
                  {tx.ref_id}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {transactions.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
}
