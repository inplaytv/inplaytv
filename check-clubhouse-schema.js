require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  console.log('\nChecking clubhouse tables...\n');
  
  const tables = [
    'clubhouse_events',
    'clubhouse_competitions',
    'clubhouse_wallets',
    'clubhouse_credit_transactions',
    'clubhouse_entries'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✓ ${table}: EXISTS`);
    }
  }
}

check();
