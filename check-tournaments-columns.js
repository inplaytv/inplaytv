require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking tournaments table columns...\n');
  
  const { data: sample, error } = await supabase
    .from('tournaments')
    .select('*')
    .limit(1)
    .single();
  
  if (sample) {
    console.log('Available columns:', Object.keys(sample).sort());
    
    const golferCols = Object.keys(sample).filter(k => k.includes('golfer'));
    console.log('\nGolfer-related columns:', golferCols);
  }
}

checkSchema();
