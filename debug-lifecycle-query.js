require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugLifecycleQuery() {
  console.log('=== DEBUGGING LIFECYCLE QUERY ===\n');

  // Test exact lifecycle query
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: true })
    .limit(1000)
    .or('is_visible.eq.true,is_visible.is.null');

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log(`✅ Query returned: ${data.length} tournaments\n`);
    if (data.length > 0) {
      data.forEach(t => {
        console.log(`Tournament: ${t.name}`);
        console.log(`  ID: ${t.id}`);
        console.log(`  is_visible: ${t.is_visible}`);
        console.log(`  start_date: ${t.start_date}`);
        console.log(`  created_at: ${t.created_at}\n`);
      });
    } else {
      console.log('❌ No tournaments returned!\n');
      
      // Try without .or() filter
      const { data: all } = await supabase
        .from('tournaments')
        .select('*');
      
      console.log(`Direct query (no filter): ${all?.length || 0} tournaments`);
      if (all && all.length > 0) {
        all.forEach(t => {
          console.log(`  - ${t.name}: is_visible=${t.is_visible}`);
        });
      }
    }
  }
}

debugLifecycleQuery()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
