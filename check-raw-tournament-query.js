const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTournamentQuery() {
  console.log('Querying ALL tournaments from database...\n');
  
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total tournaments returned: ${data.length}\n`);
  
  data.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Created: ${t.created_at}`);
    console.log(`   Start Date: ${t.start_date}`);
    console.log('');
  });
  
  const misterG = data.find(t => t.name.includes("Mister G"));
  if (misterG) {
    console.log('✅ "Mister G\'s Open" FOUND in results!');
  } else {
    console.log('❌ "Mister G\'s Open" NOT in results');
    console.log('\nSearching database directly for Mister G...');
    
    const { data: direct } = await supabase
      .from('tournaments')
      .select('*')
      .ilike('name', '%Mister G%');
    
    if (direct && direct.length > 0) {
      console.log('Found via direct search:',direct[0].name, direct[0].id);
    }
  }
}

checkTournamentQuery();
