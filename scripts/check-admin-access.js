// Check admin access and list all admin users
require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminAccess() {
  console.log('🔍 Checking admin access...\n');

  // Check admins table
  const { data: admins, error: adminsError } = await supabase
    .from('admins')
    .select('user_id, created_at');

  if (adminsError) {
    console.error('❌ Error fetching admins:', adminsError.message);
    return;
  }

  if (!admins || admins.length === 0) {
    console.log('⚠️  No admin users found in admins table!');
    console.log('\nTo grant admin access, run:');
    console.log('INSERT INTO admins (user_id) VALUES (\'YOUR_USER_ID_HERE\');\n');
  } else {
    console.log(`✅ Found ${admins.length} admin user(s):\n`);
    
    // Get user details for each admin
    for (const admin of admins) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(admin.user_id);
      
      if (authError) {
        console.log(`   User ID: ${admin.user_id} (Could not fetch details)`);
      } else {
        console.log(`   Email: ${authUser.user.email}`);
        console.log(`   User ID: ${admin.user_id}`);
        console.log(`   Added: ${new Date(admin.created_at).toLocaleString()}\n`);
      }
    }
  }

  // List all users in the system
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError.message);
    return;
  }

  console.log(`\n📋 All registered users (${users.length}):\n`);
  users.forEach(user => {
    const isAdmin = admins.some(a => a.user_id === user.id);
    console.log(`   ${user.email} - ${user.id} ${isAdmin ? '(ADMIN ✓)' : ''}`);
  });

  if (users.length > 0 && admins.length === 0) {
    console.log('\n💡 To make a user an admin, copy their user ID and run:');
    console.log('\nINSERT INTO admins (user_id) VALUES (\'paste-user-id-here\');\n');
  }
}

checkAdminAccess().catch(console.error);
