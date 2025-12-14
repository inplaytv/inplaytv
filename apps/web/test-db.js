const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDB() {
  console.log('🔍 WEB APP ENV DB CHECK...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
  console.log('Key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) + '...');
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('setting_key', 'tournament_page_background');
    
  console.log('All records:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

checkDB().catch(console.error);