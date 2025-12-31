// Direct Database Query - Bypass API
require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin client bypasses RLS
);

async function testQuery() {
  console.log('Testing different query methods...\n');
  
  // Test 1: Service role query (should work)
  console.log('1️⃣ Service Role Query (Admin):');
  const { data: adminData, error: adminError } = await supabase
    .from('email_templates')
    .select('id, name, subject, is_active');

  if (adminError) {
    console.error('   ❌ Error:', adminError.message);
  } else {
    console.log(`   ✅ Found ${adminData.length} templates`);
    adminData.forEach(t => console.log(`      - ${t.name}`));
  }

  console.log('\n2️⃣ With RLS Check (Simulating normal user):');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: anonData, error: anonError } = await anonClient
    .from('email_templates')
    .select('id, name, subject, is_active');

  if (anonError) {
    console.error('   ❌ Error:', anonError.message);
    console.log('   ⚠️  This means RLS is blocking access!');
  } else {
    console.log(`   ✅ Found ${anonData.length} templates`);
  }

  console.log('\n3️⃣ Checking RLS Policies:');
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'email_templates');

  if (policies && policies.length > 0) {
    console.log(`   Found ${policies.length} RLS policies`);
    policies.forEach(p => {
      console.log(`      - ${p.policyname}: ${p.cmd} (${p.permissive})`);
    });
  } else {
    console.log('   ⚠️  No RLS policies found - might be blocking everything!');
  }
}

testQuery();
