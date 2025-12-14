const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabase() {
  console.log('Checking database connection...');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Error:', error.message);
      
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Settings table does not exist. Creating it...');
        
        // Try to create the table
        const { data: tableData, error: createError } = await supabase.rpc('exec', {
          query: `
            CREATE TABLE IF NOT EXISTS settings (
              id SERIAL PRIMARY KEY,
              setting_key VARCHAR(255) UNIQUE NOT NULL,
              setting_value TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            INSERT INTO settings (setting_key, setting_value)
            VALUES ('tournament_page_background', '/backgrounds/golf-course-green.jpg')
            ON CONFLICT (setting_key) DO NOTHING;
          `
        });
        
        if (createError) {
          console.log('❌ Could not create table via RPC:', createError.message);
          console.log('\n📋 Please run this SQL in your Supabase dashboard:');
          console.log(`
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO settings (setting_key, setting_value)
VALUES ('tournament_page_background', '/backgrounds/golf-course-green.jpg')
ON CONFLICT (setting_key) DO NOTHING;
          `);
        } else {
          console.log('✅ Table created successfully!');
        }
      }
    } else {
      console.log('✅ Settings table exists! Data:', data);
    }
  } catch (e) {
    console.log('❌ Connection error:', e.message);
  }
}

checkDatabase().catch(console.error);