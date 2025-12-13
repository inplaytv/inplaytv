// Check current background image in database
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentBackground() {
  console.log('🔍 Current background image in database:');
  
  const { data, error } = await supabase
    .from('site_settings')
    .select('setting_key, setting_value')
    .eq('setting_key', 'coming_soon_background_image')
    .single();
    
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`📄 Current value: "${data.setting_value}"`);
  console.log(`📏 Length: ${data.setting_value.length} characters`);
}

checkCurrentBackground();