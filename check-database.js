const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('Checking Supabase connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Check if settings table exists
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .limit(1);

  console.log('Settings table query result:');
  console.log('Data:', data);
  console.log('Error:', error);
  
  // If table doesn't exist, try to create it
  if (error && error.message.includes('relation "settings" does not exist')) {
    console.log('Settings table does not exist. Let me show you the SQL to create it.');
    console.log(`
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default tournament background setting
INSERT INTO settings (setting_key, setting_value)
VALUES ('tournament_page_background', '/backgrounds/golf-course-green.jpg')
ON CONFLICT (setting_key) DO NOTHING;
    `);
  }
}

checkDatabase().catch(console.error);