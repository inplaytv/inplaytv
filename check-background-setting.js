require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBackgroundSetting() {
  console.log('Checking tournament_page_background setting...\n');
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .eq('setting_key', 'tournament_page_background')
    .single();
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (!data) {
    console.log('No setting found in database');
    return;
  }
  
  console.log('Database record:');
  console.log('- setting_key:', data.setting_key);
  console.log('- setting_value:', data.setting_value);
  console.log('\nParsed value:');
  try {
    const parsed = JSON.parse(data.setting_value);
    console.log(JSON.stringify(parsed, null, 2));
  } catch (e) {
    console.log('Not JSON, plain string:', data.setting_value);
  }
}

checkBackgroundSetting();
