require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING TOURNAMENTS TABLE SCHEMA ===\n');

  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .limit(1);

  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Column names in tournaments table:');
    Object.keys(data[0]).sort().forEach(col => {
      if (col.includes('reg')) {
        console.log(`  ✅ ${col}`);
      } else {
        console.log(`     ${col}`);
      }
    });
  }
})();
