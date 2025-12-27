require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatuses() {
  console.log('🔍 Checking ALL tournament status values in database...\n');
  
  // Get all tournaments with their status
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date')
    .order('start_date', { ascending: false });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${tournaments.length} total tournaments\n`);
  
  // Group by status
  const byStatus = {};
  tournaments.forEach(t => {
    if (!byStatus[t.status]) byStatus[t.status] = [];
    byStatus[t.status].push(t.name);
  });
  
  console.log('📊 Tournaments by Status:');
  console.log('========================\n');
  
  Object.keys(byStatus).sort().forEach(status => {
    console.log(`${status.toUpperCase()} (${byStatus[status].length}):`);
    byStatus[status].forEach(name => console.log(`  - ${name}`));
    console.log('');
  });
  
  // Check specifically for MISTER G's OPEN
  const misterG = tournaments.find(t => t.name.includes('MISTER') || t.name.includes('Mister'));
  if (misterG) {
    console.log('✅ FOUND: MISTER G\'s OPEN');
    console.log(`   Status: ${misterG.status}`);
    console.log(`   ID: ${misterG.id}`);
    console.log(`   Start Date: ${misterG.start_date}`);
  } else {
    console.log('❌ NOT FOUND: MISTER G\'s OPEN in database');
  }
}

checkStatuses().then(() => process.exit(0));
