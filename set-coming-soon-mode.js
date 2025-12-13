const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setComingSoonMode() {
  console.log('🔧 Setting site to coming-soon mode...\n');
  
  // First check if the setting exists
  const { data: existing } = await supabase
    .from('site_settings')
    .select('*')
    .eq('setting_key', 'maintenance_mode')
    .single();
  
  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('site_settings')
      .update({ setting_value: 'coming-soon' })
      .eq('setting_key', 'maintenance_mode');
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Successfully updated to coming-soon mode!');
      console.log('📝 Site will now show the premium coming-soon page to all visitors.');
      console.log('🔑 Admins can still access the full site.');
    }
  } else {
    // Create new
    const { error } = await supabase
      .from('site_settings')
      .insert({ setting_key: 'maintenance_mode', setting_value: 'coming-soon' });
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Successfully set to coming-soon mode!');
      console.log('📝 Site will now show the premium coming-soon page to all visitors.');
      console.log('🔑 Admins can still access the full site.');
    }
  }
}

setComingSoonMode();
