const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMode() {
  console.log('🔍 Checking current maintenance mode...\n');
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('setting_key', 'maintenance_mode')
    .single();
  
  if (error) {
    console.log('❌ Error:', error.message);
    console.log('\n📝 Setting may not exist. Current mode defaults to: live');
  } else {
    console.log('✅ Current setting:', data);
    console.log('\n📊 Mode:', data.setting_value);
    console.log('\nPossible values:');
    console.log('  - live: Normal site access');
    console.log('  - coming-soon: Shows coming soon page');
    console.log('  - maintenance: Shows maintenance page');
  }
}

checkMode();
