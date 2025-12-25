require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('=== Diagnosing GREENIDGE OPEN Issue ===\n');

  // Test 1: Count all tournaments
  const { count, error: countError } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact', head: true });
  console.log('1. Total tournament count:', count, countError ? `ERROR: ${countError.message}` : '');

  // Test 2: Get GREENIDGE directly
  const { data: greenidge, error: greenidgeError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084')
    .single();
  console.log('\n2. Direct GREENIDGE query:', greenidge ? 'FOUND' : 'NOT FOUND', greenidgeError ? `ERROR: ${greenidgeError.message}` : '');
  if (greenidge) {
    console.log('   Fields:', Object.keys(greenidge).length, 'columns');
  }

  // Test 3: Get THANET for comparison
  const { data: thanet, error: thanetError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', '66d0e61a-2d12-47bf-a93f-509e2b2a33f9')
    .single();
  console.log('\n3. Direct THANET query:', thanet ? 'FOUND' : 'NOT FOUND', thanetError ? `ERROR: ${thanetError.message}` : '');

  // Test 4: Get all tournaments with order by
  const { data: allTournaments, error: allError } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: true });
  console.log('\n4. SELECT * ORDER BY start_date:', allTournaments?.length, 'tournaments', allError ? `ERROR: ${allError.message}` : '');
  const hasGreenidge = allTournaments?.find(t => t.id === 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084');
  console.log('   Contains GREENIDGE:', !!hasGreenidge);

  // Test 5: Try without order by
  const { data: unordered, error: unorderedError } = await supabase
    .from('tournaments')
    .select('*');
  console.log('\n5. SELECT * (no order):', unordered?.length, 'tournaments', unorderedError ? `ERROR: ${unorderedError.message}` : '');
  const hasGreenidge2 = unordered?.find(t => t.id === 'bc7a3ef0-1a8d-42e7-bf60-5ad74e9ac084');
  console.log('   Contains GREENIDGE:', !!hasGreenidge2);

  // Test 6: Compare field values
  if (greenidge && thanet) {
    console.log('\n6. Field comparison (GREENIDGE vs THANET):');
    const keys = Object.keys(greenidge);
    for (const key of keys) {
      if (greenidge[key] !== thanet[key]) {
        console.log(`   ${key}:`, JSON.stringify(greenidge[key]), 'vs', JSON.stringify(thanet[key]));
      }
    }
  }
}

diagnose().catch(console.error);
