require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGolferSalaries() {
  const groupId = 'f2c68394-774a-4b72-ace1-c4676c2e1e86'; // Mister G's Open Field
  
  console.log('\n🔍 Checking golfer salaries for Mister G\'s Open Field...\n');
  
  const { data: golfers, error } = await supabase
    .from('golfer_group_members')
    .select(`
      golfer_id,
      golfers (
        id,
        full_name,
        salary_pennies
      )
    `)
    .eq('group_id', groupId)
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Found ${golfers?.length || 0} golfers in group\n`);
  
  golfers?.forEach(item => {
    const golfer = item.golfers;
    const salary = golfer.salary_pennies;
    const status = salary > 0 ? '✅' : '❌';
    console.log(`${status} ${golfer.full_name}: £${(salary / 100).toFixed(2)} (${salary} pennies)`);
  });

  const withoutSalary = golfers?.filter(item => !item.golfers.salary_pennies || item.golfers.salary_pennies === 0).length || 0;
  
  console.log(`\n📊 Summary: ${withoutSalary} golfers without salary`);
  
  if (withoutSalary > 0) {
    console.log('\n💡 Fix: Run DataGolf salary sync from Admin → Tournament Management');
    console.log('   Or manually set salaries in the database');
  }
}

checkGolferSalaries().catch(console.error);
