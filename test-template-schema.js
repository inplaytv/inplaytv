require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking competition_templates table...\n');
  
  const { data: sample, error } = await supabase
    .from('competition_templates')
    .select('*')
    .limit(1)
    .single();
  
  if (sample) {
    console.log('Available columns:', Object.keys(sample).sort());
    console.log('\nassigned_golfer_group_id exists?', 'assigned_golfer_group_id' in sample);
  }
  
  // Test the correct query structure
  const { data: test, error: testError } = await supabase
    .from('competition_instances')
    .select(`
      id,
      tournament_id,
      template_id,
      entry_fee_pennies,
      start_at,
      end_at,
      reg_close_at,
      status,
      competition_templates (
        name,
        rounds_covered,
        assigned_golfer_group_id
      )
    `)
    .eq('id', 'fddc6a89-37bf-4592-a1a5-8e80643954a9')
    .single();
  
  if (testError) {
    console.log('\n❌ Query with golfer_group in template FAILED:');
    console.log(testError);
  } else {
    console.log('\n✅ Query with golfer_group in template SUCCEEDED:');
    console.log(test);
  }
}

checkSchema();
