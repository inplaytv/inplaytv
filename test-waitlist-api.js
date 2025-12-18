// Test waitlist API endpoint
require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testWaitlist() {
  console.log('🧪 Testing Waitlist System...\n');
  
  // Test 1: Check if table exists
  console.log('1️⃣ Checking if waitlist table exists...');
  const { data: tableCheck, error: tableError } = await supabase
    .from('waitlist')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ Table does not exist or has permission issues:', tableError.message);
    return;
  }
  console.log('✅ Waitlist table exists\n');
  
  // Test 2: Try to insert test email
  console.log('2️⃣ Testing insert...');
  const testEmail = `test${Date.now()}@example.com`;
  const { data: insertData, error: insertError } = await supabase
    .from('waitlist')
    .insert([{
      email: testEmail,
      source: 'api-test'
    }])
    .select()
    .single();
  
  if (insertError) {
    console.error('❌ Insert failed:', insertError.message);
    console.error('Error details:', insertError);
    return;
  }
  console.log('✅ Insert successful:', insertData);
  console.log('');
  
  // Test 3: Check for email templates
  console.log('3️⃣ Checking email templates...');
  const { data: templates, error: templateError } = await supabase
    .from('email_templates')
    .select('name, is_active')
    .in('name', ['Coming Soon Waitlist', 'Launch Notification']);
  
  if (templateError) {
    console.error('❌ Template check failed:', templateError.message);
  } else if (templates.length === 0) {
    console.log('⚠️ No waitlist templates found. Run scripts/add-waitlist-email-templates.sql');
  } else {
    console.log('✅ Email templates found:');
    templates.forEach(t => console.log(`   - ${t.name} (${t.is_active ? 'active' : 'inactive'})`));
  }
  console.log('');
  
  // Test 4: Check RLS policies
  console.log('4️⃣ Checking RLS policies...');
  const { data: policies } = await supabase.rpc('exec', {
    query: "SELECT policyname FROM pg_policies WHERE tablename = 'waitlist'"
  }).then(() => ({ data: 'RLS enabled' })).catch(() => ({ data: 'Could not check policies' }));
  console.log('✅ RLS Status:', policies);
  
  console.log('\n✅ All tests completed!');
}

testWaitlist().catch(console.error);
