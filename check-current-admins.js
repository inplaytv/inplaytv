require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkAdmins() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== Checking Admins Table ===\n');
  
  const { data: admins, error } = await supabase
    .from('admins')
    .select('user_id, is_super_admin, created_at');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (!admins || admins.length === 0) {
    console.log('❌ NO ADMINS FOUND in admins table!');
    console.log('\nYou need to add your user. First, find your user ID:');
    console.log('   SELECT id, email FROM auth.users;');
    console.log('\nThen add to admins table:');
    console.log("   INSERT INTO admins (user_id, is_super_admin) VALUES ('your-user-id-here', true);");
    return;
  }
  
  console.log(`✅ Found ${admins.length} admin(s):\n`);
  
  for (const admin of admins) {
    // Get user email
    const { data: { user } } = await supabase.auth.admin.getUserById(admin.user_id);
    
    console.log(`User ID: ${admin.user_id}`);
    console.log(`Email: ${user?.email || 'Unknown'}`);
    console.log(`Super Admin: ${admin.is_super_admin}`);
    console.log(`Created: ${admin.created_at}`);
    console.log('---');
  }
}

checkAdmins().catch(console.error);
