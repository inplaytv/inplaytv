const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'apps', 'web', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Looking for .env.local in:', path.join(__dirname, 'apps', 'web', '.env.local'));
  console.error('\nPlease ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupComingSoonSettings() {
  console.log('🔧 Setting up Coming Soon page customization settings...\n');

  const settings = [
    { key: 'coming_soon_headline', value: 'COMING SOON' },
    { key: 'coming_soon_description', value: 'Precision meets passion in a live, immersive format. Competition will never emerge the same.' },
    { key: 'coming_soon_background_image', value: '/backgrounds/golf-03.jpg' },
    { key: 'coming_soon_logo_text', value: 'InPlayTV' },
    { key: 'coming_soon_tagline', value: 'A new way to follow what matters.' }
  ];

  for (const setting of settings) {
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: setting.key,
        setting_value: setting.value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select();

    if (error) {
      console.error(`❌ Error adding ${setting.key}:`, error.message);
    } else {
      console.log(`✅ ${setting.key}: ${setting.value}`);
    }
  }

  console.log('\n✅ Coming soon settings configured successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to http://localhost:3002/settings/site');
  console.log('2. Scroll to "Coming Soon Page Customization"');
  console.log('3. Edit the headline, description, or background image');
  console.log('4. Click "Save Changes"');
  console.log('5. The changes will appear immediately on the coming soon page!\n');
}

setupComingSoonSettings().catch(console.error);
