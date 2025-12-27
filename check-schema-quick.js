require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  const { data, error } = await supabase
    .from('competition_entries')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('competition_entries columns:', Object.keys(data[0]));
  } else {
    console.log('No entries found - checking with RPC');
    // Query information schema
    const { data: cols } = await supabase.rpc('exec_sql', {
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'competition_entries' ORDER BY ordinal_position`
    });
    console.log('Columns from schema:', cols);
  }
}

checkSchema().catch(console.error);
