require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClubhouseTables() {
  console.log('🔍 Checking Clubhouse Database Status...');
  console.log('');
  
  const tables = [
    'clubhouse_events',
    'clubhouse_competitions', 
    'clubhouse_wallets',
    'clubhouse_credit_transactions',
    'clubhouse_entries',
    'clubhouse_entry_picks'
  ];
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} rows`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
  
  console.log('');
  console.log('📊 Checking for events...');
  
  const { data: events, error: eventsError } = await supabase
    .from('clubhouse_events')
    .select('id, name, slug, status')
    .limit(5);
    
  if (eventsError) {
    console.log('❌ Error fetching events:', eventsError.message);
  } else if (events && events.length > 0) {
    console.log(`✅ Found ${events.length} events:`);
    events.forEach(e => console.log(`   - ${e.name} (${e.status})`));
  } else {
    console.log('⚠️  No events found');
  }
  
  console.log('');
  console.log('Done!');
}

checkClubhouseTables();
