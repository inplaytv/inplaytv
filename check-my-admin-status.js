require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in apps/admin/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdminStatus() {
  try {
    console.log('\n🔍 Checking admin status...\n');

    // Get all admins
    const { data: admins, error } = await supabase
      .from('admins')
      .select('user_id, is_super_admin, created_at');

    if (error) {
      throw error;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  No admins found in database!\n');
      return;
    }

    console.log(`📊 Total Admins: ${admins.length}\n`);

    // Get user details for each admin
    for (const admin of admins) {
      const { data: { user } } = await supabase.auth.admin.getUserById(admin.user_id);
      
      const isSuperAdmin = admin.is_super_admin === true;
      const icon = isSuperAdmin ? '👑' : '👤';
      const status = isSuperAdmin ? 'SUPER ADMIN' : 'Regular Admin';
      
      console.log(`${icon} ${status}`);
      console.log(`   User ID: ${admin.user_id}`);
      console.log(`   Email: ${user?.email || 'N/A'}`);
      console.log(`   Created: ${new Date(admin.created_at).toLocaleString()}`);
      console.log('');
    }

    // Summary
    const superAdminCount = admins.filter(a => a.is_super_admin === true).length;
    console.log('─────────────────────────────────');
    console.log(`👑 Super Admins: ${superAdminCount}`);
    console.log(`👤 Regular Admins: ${admins.length - superAdminCount}`);
    console.log('─────────────────────────────────\n');

    // Show how to make someone super admin
    if (superAdminCount === 0) {
      console.log('⚠️  WARNING: No super admins found!');
      console.log('\nTo make yourself super admin, run:');
      console.log('node make-super-admin.js YOUR_EMAIL@example.com\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAdminStatus();
