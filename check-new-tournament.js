require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING ALL TOURNAMENTS ===\n');
  
  const {data: tournaments} = await supabase
    .from('tournaments')
    .select('id, name, status, is_visible, created_at')
    .order('created_at', {ascending: false})
    .limit(5);
  
  console.log('Recent tournaments:');
  tournaments?.forEach(t => {
    console.log(`\n- ${t.name}`);
    console.log('  Status:', t.status);
    console.log('  Visible:', t.is_visible);
    console.log('  Created:', new Date(t.created_at).toLocaleString());
  });
  
  console.log('\n=== WHERE EACH APPEARS ===');
  console.log('Lifecycle Manager: No filters (shows ALL tournaments)');
  console.log('Tournament Listings: No filters either (shows ALL tournaments)');
  console.log('\nBoth pages query tournaments table directly.');
  console.log('Check if new tournament is actually in database...');
})();
