require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testForeignKey() {
  console.log('Testing different foreign key syntaxes...\n');

  // Test 1: Simple join
  console.log('1. Testing simple join: tournament_competitions(*)');
  const { data: data1, error: error1 } = await supabase
    .from('competition_results')
    .select('*, tournament_competitions(*)')
    .limit(1);
  
  if (error1) {
    console.log('❌ Error:', error1.message);
    console.log('   Hint:', error1.hint);
  } else {
    console.log('✅ Success! Data returned:', data1?.length > 0 ? 'YES' : 'NO');
  }

  // Test 2: With column specifier
  console.log('\n2. Testing with column: tournament_competitions!competition_id(*)');
  const { data: data2, error: error2 } = await supabase
    .from('competition_results')
    .select('*, tournament_competitions!competition_id(*)')
    .limit(1);
  
  if (error2) {
    console.log('❌ Error:', error2.message);
    console.log('   Hint:', error2.hint);
  } else {
    console.log('✅ Success! Data returned:', data2?.length > 0 ? 'YES' : 'NO');
    if (data2?.length > 0) {
      console.log('   Sample data:', JSON.stringify(data2[0], null, 2));
    }
  }

  // Test 3: List what we got
  console.log('\n3. Checking if data includes max_entries...');
  if (data2 && data2.length > 0) {
    console.log('   Has tournament_competitions?', !!data2[0].tournament_competitions);
    if (data2[0].tournament_competitions) {
      console.log('   max_entries:', data2[0].tournament_competitions.max_entries);
    }
  }

  process.exit(0);
}

testForeignKey();
