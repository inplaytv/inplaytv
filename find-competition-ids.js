require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n🔍 Finding Competition IDs...\n');
  
  const { data: competitions, error } = await supabase
    .from('tournament_competitions')
    .select('id, entry_fee_pennies, status, tournament_id, competition_type_id')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (!competitions || competitions.length === 0) {
    console.log('❌ No competitions found in database');
    return;
  }
  
  console.log(`✅ Found ${competitions.length} competitions:\n`);
  
  for (const comp of competitions) {
    console.log(`Competition ID: ${comp.id}`);
    console.log(`   Fee: £${comp.entry_fee_pennies / 100}`);
    console.log(`   Status: ${comp.status}`);
    console.log(`   InPlay URL: http://localhost:3003/build-team/${comp.id}`);
    console.log(`   Clubhouse URL: http://localhost:3003/clubhouse/build-team/${comp.id}\n`);
  }
})();
