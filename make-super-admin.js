require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in apps/admin/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const emailToPromote = process.argv[2];

if (!emailToPromote) {
  console.log('\n❌ Please provide an email address');
  console.log('Usage: node make-super-admin.js YOUR_EMAIL@example.com\n');
  process.exit(1);
}

async function makeSuperAdmin() {
  try {
    console.log(`\n🔍 Looking for user: ${emailToPromote}...\n`);

    // Find user by email
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) throw userError;

    const user = users.find(u => u.email?.toLowerCase() === emailToPromote.toLowerCase());

    if (!user) {
      console.log(`❌ User not found: ${emailToPromote}`);
      console.log('\nAvailable users:');
      users.forEach(u => console.log(`   - ${u.email}`));
      console.log('');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (${user.id})\n`);

    // Check if already in admins table
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingAdmin) {
      if (existingAdmin.is_super_admin) {
        console.log('ℹ️  User is already a Super Admin!\n');
        return;
      }

      // Update to super admin
      const { error: updateError } = await supabase
        .from('admins')
        .update({ is_super_admin: true })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      console.log('👑 Successfully promoted to Super Admin!\n');
    } else {
      // Insert new admin record
      const { error: insertError } = await supabase
        .from('admins')
        .insert({
          user_id: user.id,
          is_super_admin: true,
        });

      if (insertError) throw insertError;

      console.log('👑 Successfully added as Super Admin!\n');
    }

    // Verify
    const { data: verifyAdmin } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    console.log('✅ Verification:');
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Super Admin: ${verifyAdmin.is_super_admin ? 'YES 👑' : 'NO'}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    process.exit(1);
  }
}

makeSuperAdmin();
