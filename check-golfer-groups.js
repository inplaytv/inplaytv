require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking golfer_groups table...\n');
  
  const { data: groups, error } = await supabase
    .from('golfer_groups')
    .select('*')
    .limit(3);
  
  if (groups && groups.length > 0) {
    console.log('Sample golfer_groups columns:', Object.keys(groups[0]).sort());
    console.log('\nSample records:');
    groups.forEach(g => {
      console.log(`- ${g.name || g.id}: tournament_id = ${g.tournament_id || 'N/A'}`);
    });
  }
}

checkSchema();
