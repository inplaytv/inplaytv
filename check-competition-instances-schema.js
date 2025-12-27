require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n🔍 Checking competition_instances schema...\n');
  
  // Get schema info
  const { data: columns, error } = await supabase
    .rpc('get_table_columns', { table_name: 'competition_instances' })
    .catch(async () => {
      // Fallback: query information_schema
      return await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'competition_instances')
        .eq('table_schema', 'public');
    });

  if (error) {
    console.log('⚠️ RPC not available, trying direct query...');
    
    // Try a simple select to see what we get
    const { data: sample, error: sampleError } = await supabase
      .from('competition_instances')
      .select('*')
      .limit(1)
      .single();
    
    if (sample) {
      console.log('✅ Available columns:', Object.keys(sample));
      console.log('\n📊 Sample record:', sample);
      
      if (sample.assigned_golfer_group_id !== undefined) {
        console.log('\n✅ assigned_golfer_group_id EXISTS');
      } else {
        console.log('\n❌ assigned_golfer_group_id DOES NOT EXIST');
      }
    } else {
      console.log('❌ Error:', sampleError);
    }
  } else {
    console.log('Columns:', columns);
  }
  
  // Test the exact query we're using
  console.log('\n🧪 Testing actual query...\n');
  const { data: test, error: testError } = await supabase
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
    .eq('id', 'fddc6a89-37bf-4592-a1a5-8e80643954a9')
    .single();
  
  if (testError) {
    console.log('❌ Query failed:', testError);
  } else {
    console.log('✅ Query succeeded:', test);
  }
}

checkSchema().catch(console.error);
