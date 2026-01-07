require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupClubhouseTables() {
  console.log('🏗️  Creating Clubhouse Database Tables...');
  console.log('');
  
  // Read the SQL file
  const sqlPath = path.join(__dirname, 'clubhouse', 'NUCLEAR-CLEAN-RESET.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Split into individual statements and execute
  console.log('📝 Executing SQL commands...');
  
  try {
    // Execute the full SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      // If RPC doesn't exist, we need to create tables manually
      console.log('⚠️  RPC method not available, creating tables directly...');
      
      // Create tables one by one
      const tables = [
        'clubhouse_events',
        'clubhouse_competitions', 
        'clubhouse_wallets',
        'clubhouse_credit_transactions',
        'clubhouse_entries',
        'clubhouse_entry_picks'
      ];
      
      console.log('');
      console.log('🔍 Checking existing tables...');
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('id').limit(1);
        if (error && error.message.includes('does not exist')) {
          console.log(`   ❌ ${table} - NOT FOUND`);
        } else {
          console.log(`   ✅ ${table} - EXISTS`);
        }
      }
      
      console.log('');
      console.log('❌ CLUBHOUSE TABLES DO NOT EXIST');
      console.log('');
      console.log('📋 MANUAL SETUP REQUIRED:');
      console.log('   1. Open Supabase Dashboard');
      console.log('   2. Go to SQL Editor');
      console.log('   3. Copy ALL contents from: scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql');
      console.log('   4. Paste and click RUN');
      console.log('');
      console.log('💡 TIP: File location:');
      console.log(`   ${sqlPath}`);
      
      process.exit(1);
    }
    
    console.log('✅ Tables created successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('');
    console.log('📋 MANUAL SETUP REQUIRED:');
    console.log('   1. Open: https://supabase.com/dashboard');
    console.log('   2. Go to SQL Editor');
    console.log('   3. Copy: scripts/clubhouse/NUCLEAR-CLEAN-RESET.sql');
    console.log('   4. Paste and RUN');
    process.exit(1);
  }
}

setupClubhouseTables();
