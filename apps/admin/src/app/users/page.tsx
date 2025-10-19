import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';

export const dynamic = 'force-dynamic';

async function searchUsers(query?: string) {
  const adminClient = createAdminClient();
  
  // Get auth users
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  
  // Get wallet balances
  const { data: wallets } = await adminClient
    .from('wallets')
    .select('user_id, balance_cents');
  
  const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance_cents]) || []);
  
  // Filter and map
  let filteredUsers = users || [];
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredUsers = filteredUsers.filter(u => 
      u.email?.toLowerCase().includes(lowerQuery) ||
      u.id.toLowerCase().includes(lowerQuery)
    );
  }
  
  return filteredUsers.slice(0, 50).map(u => ({
    id: u.id,
    email: u.email || 'No email',
    created_at: u.created_at,
    balance_cents: walletMap.get(u.id) || 0,
  }));
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  await assertAdminOrRedirect();
  const users = await searchUsers(searchParams.q);
  
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Users</h1>
      
      <form method="GET" style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          name="q"
          placeholder="Search by email or ID..."
          defaultValue={searchParams.q || ''}
          style={{
            padding: '0.75rem',
            border: '1px solid #eaeaea',
            borderRadius: '6px',
            width: '100%',
            maxWidth: '400px',
            fontSize: '1rem',
          }}
        />
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
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Email</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Balance</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: '1rem' }}>{user.email}</td>
                <td style={{ padding: '1rem', fontWeight: 500 }}>
                  £{(user.balance_cents / 100).toFixed(2)}
                </td>
                <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                  {new Date(user.created_at).toLocaleDateString('en-GB')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>
            No users found
          </div>
        )}
      </div>
    </div>
  );
}
