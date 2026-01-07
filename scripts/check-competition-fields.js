require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetitionFields() {
  console.log('🔍 Checking clubhouse_competitions table structure...\n');
  
  const { data, error } = await supabase
    .from('clubhouse_competitions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Available fields:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\nSample data:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No competitions found');
  }
}

checkCompetitionFields();
