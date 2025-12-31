require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLifecycleQuery() {
  console.log('=== TESTING LIFECYCLE QUERY ===\n');

  // Test 1: Get all tournaments (no filter)
  const { data: all, error: allError } = await supabase
    .from('tournaments')
    .select('id, name, is_visible, start_date')
    .order('start_date', { ascending: true });

  console.log('ALL TOURNAMENTS (no filter):');
  console.log(`Count: ${all?.length || 0}`);
  if (all && all.length > 0) {
    all.forEach(t => {
      console.log(`  - ${t.name}: is_visible=${t.is_visible}, start=${t.start_date}`);
    });
  }
  console.log();

  // Test 2: Lifecycle query (with or filter)
  const { data: lifecycle, error: lifecycleError } = await supabase
    .from('tournaments')
    .select('id, name, is_visible, start_date')
    .order('start_date', { ascending: true })
    .limit(1000)
    .or('is_visible.eq.true,is_visible.is.null');

  console.log('LIFECYCLE QUERY (with .or filter):');
  console.log(`Count: ${lifecycle?.length || 0}`);
  if (lifecycle && lifecycle.length > 0) {
    lifecycle.forEach(t => {
      console.log(`  - ${t.name}: is_visible=${t.is_visible}, start=${t.start_date}`);
    });
  } else {
    console.log('  ❌ NO RESULTS!');
  }
  
  if (lifecycleError) {
    console.log('\n❌ Error:', lifecycleError);
  }
}

testLifecycleQuery()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
