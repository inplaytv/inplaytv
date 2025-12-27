require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  const id = 'fddc6a89-37bf-4592-a1a5-8e80643954a9'; // ONE 2 ONE instance
  
  console.log('Testing unified query for ONE 2 ONE instance...\n');
  
  const { data: one2one, error: one2oneError } = await supabase
    .from('competition_instances')
    .select(`
      id,
      tournament_id,
      template_id,
      entry_fee_pennies,
      start_at,
      end_at,
      reg_open_at,
      reg_close_at,
      status,
      assigned_golfer_group_id,
      competition_templates (
        name,
        rounds_covered
      )
    `)
    .eq('id', id)
    .single();
  
  if (one2oneError) {
    console.log('❌ Query FAILED:', one2oneError);
  } else {
    console.log('✅ Query SUCCEEDED');
    console.log('Data:', JSON.stringify(one2one, null, 2));
    console.log('\nGolfer group ID:', one2one.assigned_golfer_group_id);
  }
}

testQuery();
