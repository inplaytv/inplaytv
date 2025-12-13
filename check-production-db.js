// Check production database maintenance mode
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSettings() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n🔍 Checking production database settings...\n');
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  // Check maintenance mode
  const { data: modeData, error: modeError } = await supabase
    .from('site_settings')
    .select('*')
    .eq('setting_key', 'maintenance_mode')
    .single();

  if (modeError) {
    console.error('❌ Error fetching maintenance_mode:', modeError);
  } else {
    console.log('✅ maintenance_mode:', modeData);
  }

  // Check all coming soon settings
  const { data: comingSoonData, error: csError } = await supabase
    .from('site_settings')
    .select('*')
    .like('setting_key', 'coming_soon_%');

  if (csError) {
    console.error('❌ Error fetching coming soon settings:', csError);
  } else {
    console.log('\n✅ Coming soon settings:');
    comingSoonData.forEach(setting => {
      console.log(`  - ${setting.setting_key}: ${setting.setting_value}`);
    });
  }

  console.log('\n📝 Summary:');
  console.log(`  Mode is: ${modeData?.setting_value || 'NOT SET'}`);
  console.log(`  Expected: "coming-soon"`);
  console.log(`  Match: ${modeData?.setting_value === 'coming-soon' ? '✅ YES' : '❌ NO'}`);
}

checkSettings().catch(console.error);
