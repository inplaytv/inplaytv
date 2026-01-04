require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsers() {
  // Get profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .order('display_name');

  // Get auth users
  const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

  console.log('\n👥 USERS WITH EMAILS:');
  console.log('========================');
  profiles.forEach(profile => {
    const authUser = authUsers.find(u => u.id === profile.id);
    console.log(`ID: ${profile.id}`);
    console.log(`Display: ${profile.display_name}`);
    console.log(`Email: ${authUser?.email || 'Unknown'}`);
    console.log('---');
  });
}

checkUsers();
