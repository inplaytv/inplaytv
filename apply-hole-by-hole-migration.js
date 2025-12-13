const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: './apps/golf/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📊 Applying hole-by-hole migration to tournament_golfers table...\n');

  try {
    // Read the SQL migration file
    const sql = fs.readFileSync('./ADD-HOLE-BY-HOLE-SCORES.sql', 'utf8');
    
    console.log('📝 Migration SQL:');
    console.log(sql);
    console.log('\n⏳ Executing migration...\n');

    // Execute the migration using rpc or direct SQL
    // Note: Supabase JS client doesn't directly support ALTER TABLE
    // We'll use the REST API's RPC endpoint
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => {
      // If RPC doesn't exist, we'll need to use the SQL editor manually
      return { data: null, error: { message: 'RPC method not available' } };
    });

    if (error && error.message === 'RPC method not available') {
      console.log('⚠️  Direct SQL execution not available via JS client.');
      console.log('📋 Please apply this migration manually:\n');
      console.log('1. Go to your Supabase dashboard SQL Editor');
      console.log('2. Copy the content from ADD-HOLE-BY-HOLE-SCORES.sql');
      console.log('3. Paste and execute it\n');
      console.log('OR use psql command line:');
      console.log(`psql "${supabaseUrl.replace('https://', 'postgresql://postgres:[password]@')}?sslmode=require" < ADD-HOLE-BY-HOLE-SCORES.sql\n`);
      
      // Let's verify if the columns already exist
      console.log('🔍 Checking if columns already exist...\n');
      const { data: sampleData, error: checkError } = await supabase
        .from('tournament_golfers')
        .select('r1_holes, r2_holes, r3_holes, r4_holes')
        .limit(1);
      
      if (!checkError) {
        console.log('✅ Columns already exist! Migration may have been applied previously.');
      } else {
        console.log('❌ Columns do not exist. Please apply the migration manually.');
      }
      
      return;
    }

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    
    // Verify the columns were added
    console.log('\n🔍 Verifying columns were added...\n');
    const { data: verifyData, error: verifyError } = await supabase
      .from('tournament_golfers')
      .select('r1_holes, r2_holes, r3_holes, r4_holes')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
    } else {
      console.log('✅ Columns verified successfully!');
      console.log('Sample row:', verifyData);
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
