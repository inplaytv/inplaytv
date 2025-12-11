import { assertAdminOrRedirect } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabaseAdminServer';
import UsersList from '@/components/UsersList';

export const dynamic = 'force-dynamic';

async function searchUsers(query?: string) {
  const adminClient = createAdminClient();
  
  // Get auth users
  const { data: { users } } = await adminClient.auth.admin.listUsers();
  
  // Get profiles for username, phone and personal info
  const { data: profiles, error: profilesError } = await adminClient
    .from('profiles')
    .select('id, username, phone, first_name, last_name, display_name, date_of_birth, address_line1, address_line2, city, postcode, country');
  
  if (profilesError) {
    console.error('❌ Profiles query error:', profilesError);
  }
  
  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
  
  // Get wallet balances
  const { data: wallets } = await adminClient
    .from('wallets')
    .select('user_id, balance_cents');
  
  const walletMap = new Map(wallets?.map(w => [w.user_id, w.balance_cents]) || []);
  
  // Check if user is admin
  const { data: admins } = await adminClient
    .from('admins')
    .select('user_id');
  
  const adminSet = new Set(admins?.map(a => a.user_id) || []);
  
  // Filter and map
  let filteredUsers = users || [];
  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredUsers = filteredUsers.filter(u => {
      const profile = profileMap.get(u.id);
      return (
        u.email?.toLowerCase().includes(lowerQuery) ||
        u.id.toLowerCase().includes(lowerQuery) ||
        profile?.username?.toLowerCase().includes(lowerQuery) ||
        profile?.phone?.includes(query)
      );
    });
  }
  
  return filteredUsers.slice(0, 100).map(u => {
    const profile = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email || 'No email',
      username: profile?.username || null,
      phone: profile?.phone || null,
      first_name: profile?.first_name || null,
      last_name: profile?.last_name || null,
      display_name: profile?.display_name || null,
      date_of_birth: profile?.date_of_birth || null,
      address_line1: profile?.address_line1 || null,
      address_line2: profile?.address_line2 || null,
      city: profile?.city || null,
      postcode: profile?.postcode || null,
      country: profile?.country || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
      email_confirmed_at: u.email_confirmed_at || null,
      balance_cents: walletMap.get(u.id) || 0,
      is_admin: adminSet.has(u.id),
      banned_until: (u as any).banned_until || null,
      app_metadata: u.app_metadata,
      user_metadata: u.user_metadata,
    };
  });
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
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1.5rem', fontWeight: 700 }}>Users</h1>
      
      <UsersList users={users} searchQuery={searchParams.q} />
    </div>
  );
}
