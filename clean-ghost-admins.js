require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanGhostAdmins() {
  try {
    console.log('\n🔍 Checking for admin records...\n');

    // Get all admins
    const { data: admins, error } = await supabase
      .from('admins')
      .select('*');

    if (error) throw error;

    console.log(`Found ${admins.length} admin record(s) in database\n`);

    // Get all auth users
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userIds = new Set(users.map(u => u.id));

    // Find orphaned admin records (admin record exists but auth user doesn't)
    const orphanedAdmins = admins.filter(admin => !userIds.has(admin.user_id));

    if (orphanedAdmins.length === 0) {
      console.log('✅ No ghost admin records found. Database is clean!\n');
      
      // Show current admins
      console.log('Current admins:');
      for (const admin of admins) {
        const user = users.find(u => u.id === admin.user_id);
        const icon = admin.is_super_admin ? '👑' : '👤';
        console.log(`${icon} ${user?.email} (${admin.user_id})`);
      }
      console.log('');
      return;
    }

    console.log(`⚠️  Found ${orphanedAdmins.length} ghost admin record(s):\n`);
    
    for (const ghost of orphanedAdmins) {
      console.log(`   Ghost: ${ghost.user_id}`);
      console.log(`   Created: ${ghost.created_at}`);
      console.log(`   Super Admin: ${ghost.is_super_admin}`);
      console.log('');
    }

    console.log('🗑️  Removing ghost records...\n');

    for (const ghost of orphanedAdmins) {
      const { error: deleteError } = await supabase
        .from('admins')
        .delete()
        .eq('user_id', ghost.user_id);

      if (deleteError) {
        console.error(`❌ Failed to delete ${ghost.user_id}:`, deleteError.message);
      } else {
        console.log(`✅ Removed ghost admin: ${ghost.user_id}`);
      }
    }

    console.log('\n✅ Cleanup complete!\n');

    // Show remaining admins
    const { data: remainingAdmins } = await supabase
      .from('admins')
      .select('*');

    console.log(`Remaining admins: ${remainingAdmins.length}`);
    for (const admin of remainingAdmins) {
      const user = users.find(u => u.id === admin.user_id);
      const icon = admin.is_super_admin ? '👑' : '👤';
      console.log(`${icon} ${user?.email} (${admin.user_id})`);
    }
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

cleanGhostAdmins();
