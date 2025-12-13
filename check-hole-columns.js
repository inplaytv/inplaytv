const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('🔍 Checking if hole-by-hole columns exist...\n');
  
  const { data, error } = await supabase
    .from('tournament_golfers')
    .select('r1_holes, r2_holes, r3_holes, r4_holes')
    .limit(1);
  
  if (error) {
    console.log('❌ Columns do NOT exist');
    console.log('Error:', error.message);
    console.log('\n📋 You need to apply the migration:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL from ADD-HOLE-BY-HOLE-SCORES.sql\n');
  } else {
    console.log('✅ Columns EXIST!');
    console.log('Sample data:', data);
  }
}

checkColumns();
