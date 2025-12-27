/**
 * Quick check of what backgrounds are in the database
 */

require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBackgrounds() {
  console.log('🔍 Checking background settings in database...\n');

  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .like('setting_key', '%background%')
    .order('setting_key');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️  No background settings found in database!');
    console.log('\n💡 Run this SQL in Supabase SQL Editor:\n');
    console.log(`INSERT INTO public.site_settings (setting_key, setting_value)
VALUES ('tournament_page_background', '{"backgroundImage":"/backgrounds/golf-03.jpg","backgroundUrl":"/backgrounds/golf-03.jpg","opacity":0.15,"overlay":0.4}')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;`);
    return;
  }

  console.log(`✅ Found ${data.length} background settings:\n`);

  for (const setting of data) {
    console.log(`📄 ${setting.setting_key}`);
    try {
      const parsed = JSON.parse(setting.setting_value);
      console.log(`   Image: ${parsed.backgroundImage || parsed.backgroundUrl || 'N/A'}`);
      console.log(`   Opacity: ${parsed.opacity ?? 'N/A'}`);
      console.log(`   Overlay: ${parsed.overlay ?? 'N/A'}`);
    } catch {
      console.log(`   Raw Value: ${setting.setting_value}`);
    }
    console.log(`   Updated: ${setting.updated_at}\n`);
  }
}

checkBackgrounds();
