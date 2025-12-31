require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompTypes() {
  const { data, error } = await supabase
    .from('competition_types')
    .select('*')
    .order('name');
  
  if (error) {
    console.error(error);
    process.exit(1);
  }
  
  console.log('\n=== ALL COMPETITION TYPES ===\n');
  data.forEach(ct => {
    console.log(`Slug: "${ct.slug}"`);
    console.log(`Name: ${ct.name}`);
    console.log(`Is Default: ${ct.is_default}`);
    console.log(`Default Entry Fee: £${(ct.default_entry_fee_pennies || 0) / 100}`);
    console.log(`Default Cap: ${ct.default_entrants_cap}`);
    console.log('---');
  });
  
  console.log(`\nTotal: ${data.length} competition types`);
  const defaults = data.filter(ct => ct.is_default);
  console.log(`Marked as default: ${defaults.length}`);
  
  if (defaults.length > 0) {
    console.log('\nDefault competition types:');
    defaults.forEach(ct => console.log(`  - ${ct.slug}: ${ct.name}`));
  }
  
  process.exit(0);
}

checkCompTypes();
