// Test Supabase Connection
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './apps/golf/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n=== Supabase Connection Test ===\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Found' : '✗ Missing');
  process.exit(1);
}

console.log('✓ Environment variables found');
console.log(`  Supabase URL: ${supabaseUrl}`);
console.log(`  Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    
    // Test 1: Check if we can connect to Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.log('  ⚠️  profiles table does not exist (this is okay if database not set up)');
      } else {
        console.log('  ❌ Error:', error.message);
      }
    } else {
      console.log('  ✓ Connection successful!');
    }

    // Test 2: Check auth session
    console.log('\n2. Testing authentication status...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('  ❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('  ✓ Active session found');
      console.log('    User:', session.user.email);
    } else {
      console.log('  ℹ  No active session (not logged in)');
    }

    // Test 3: Try to sign in with test credentials
    console.log('\n3. Testing authentication endpoint...');
    console.log('  (This will fail with invalid credentials, but tests the endpoint)');
    
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'testpassword',
    });
    
    if (signInError) {
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('  ✓ Auth endpoint working (invalid credentials, as expected)');
      } else if (signInError.message.includes('rate limit')) {
        console.log('  ⚠️  RATE LIMITED! You need to wait before trying again.');
        console.log('     Wait 2-5 minutes before attempting to log in.');
      } else {
        console.log('  ❌ Auth error:', signInError.message);
      }
    } else {
      console.log('  ⚠️  Unexpected: login succeeded with test credentials');
    }

    console.log('\n=== Test Complete ===\n');

  } catch (err) {
    console.error('\n❌ Unexpected error:', err.message);
    console.error(err);
  }
}

testConnection();
