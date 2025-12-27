require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Testing ONE 2 ONE instance query...\n');
  
  // First, get all columns
  const { data: sample, error: sampleError } = await supabase
    .from('competition_instances')
    .select('*')
    .limit(1)
    .single();
  
  if (sample) {
    console.log('Available columns:', Object.keys(sample).sort());
    console.log('\nassigned_golfer_group_id exists?', 'assigned_golfer_group_id' in sample);
  }
  
  // Now test the exact query
  const { data: test, error: testError } = await supabase
    .from('competition_instances')
    .select(`
      id,
      assigned_golfer_group_id,
      competition_templates (
        name,
        rounds_covered
      )
    `)
    .eq('id', 'fddc6a89-37bf-4592-a1a5-8e80643954a9')
    .single();
  
  if (testError) {
    console.log('\n❌ Query FAILED:');
    console.log(testError);
  } else {
    console.log('\n✅ Query SUCCEEDED:');
    console.log(test);
  }
}

checkSchema();
