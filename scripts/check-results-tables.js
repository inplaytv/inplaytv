require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('Checking competition results system tables...\n');

  // Check competition_results table
  console.log('1. Checking competition_results table...');
  const { data: results, error: resultsError } = await supabase
    .from('competition_results')
    .select('*')
    .limit(1);
  
  if (resultsError) {
    console.log('❌ competition_results table NOT found or error:', resultsError.message);
  } else {
    console.log('✅ competition_results table exists');
    console.log('   Records:', results?.length || 0);
  }

  // Check competition_payouts table
  console.log('\n2. Checking competition_payouts table...');
  const { data: payouts, error: payoutsError } = await supabase
    .from('competition_payouts')
    .select('*')
    .limit(1);
  
  if (payoutsError) {
    console.log('❌ competition_payouts table NOT found or error:', payoutsError.message);
  } else {
    console.log('✅ competition_payouts table exists');
    console.log('   Records:', payouts?.length || 0);
  }

  // Check competition_analytics table
  console.log('\n3. Checking competition_analytics table...');
  const { data: analytics, error: analyticsError } = await supabase
    .from('competition_analytics')
    .select('*')
    .limit(1);
  
  if (analyticsError) {
    console.log('❌ competition_analytics table NOT found or error:', analyticsError.message);
  } else {
    console.log('✅ competition_analytics table exists');
    console.log('   Records:', analytics?.length || 0);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const allExist = !resultsError && !payoutsError && !analyticsError;
  if (allExist) {
    console.log('✅ All competition results system tables exist!');
  } else {
    console.log('❌ Some tables are missing. Run the migration:');
    console.log('   Run this SQL in Supabase SQL Editor:');
    console.log('   scripts/migrations/add-competition-results-system.sql');
  }

  process.exit(0);
}

checkTables();
