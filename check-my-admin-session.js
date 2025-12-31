require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSession() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('\n=== Checking Admin Session ===\n');
  
  // You'll need to provide your auth token
  console.log('Please log in to admin at http://localhost:3002/login');
  console.log('Then open browser DevTools > Application > Cookies');
  console.log('Copy the value of the "sb-xxx-auth-token" cookie\n');
  console.log('Run: node check-my-admin-session.js YOUR_TOKEN_HERE\n');
  
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ No token provided. Please run with your auth token as argument.');
    return;
  }
  
  // Set the session
  const { data: { session }, error: sessionError } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: token
  });
  
  if (sessionError || !session) {
    console.log('❌ Invalid token or session error:', sessionError?.message);
    return;
  }
  
  console.log('✅ Session valid for user:', session.user.email);
  console.log('   User ID:', session.user.id);
  
  // Check if user is admin
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: adminRecord, error: adminError } = await adminClient
    .from('admins')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  
  if (adminError || !adminRecord) {
    console.log('\n❌ User NOT in admins table!');
    console.log('   Error:', adminError?.message);
    console.log('\n   You need to add this user to the admins table:');
    console.log(`   INSERT INTO admins (user_id, is_super_admin) VALUES ('${session.user.id}', true);`);
    return;
  }
  
  console.log('\n✅ User IS an admin:');
  console.log('   Super Admin:', adminRecord.is_super_admin);
  console.log('   Created:', adminRecord.created_at);
  
  console.log('\n✅ Everything looks good! The issue must be with cookie handling in API routes.');
}

checkSession().catch(console.error);
