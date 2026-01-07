require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateSalaries() {
  console.log('📊 Fetching golfers...');
  
  const { data: golfers, error: fetchError } = await supabase
    .from('golfers')
    .select('id, full_name, salary_pennies, world_ranking');
    
  if (fetchError) {
    console.error('❌ Error:', fetchError);
    process.exit(1);
  }
  
  console.log(`✅ Found ${golfers.length} golfers`);
  console.log('🔄 Recalculating salaries based on world rankings...');
  console.log('');
  
  let updated = 0;
  for (const golfer of golfers) {
    let newSalary;
    const ranking = golfer.world_ranking || 999;
    
    if (ranking <= 10) {
      // Top 10: £12,000 - £15,000
      newSalary = 1200000 + Math.floor(Math.random() * 300000);
    } else if (ranking <= 50) {
      // Top 11-50: £9,000 - £11,999
      newSalary = 900000 + Math.floor(Math.random() * 299900);
    } else if (ranking <= 100) {
      // Top 51-100: £7,000 - £8,999
      newSalary = 700000 + Math.floor(Math.random() * 199900);
    } else {
      // Others: £5,000 - £6,999
      newSalary = 500000 + Math.floor(Math.random() * 199900);
    }
    
    const { error: updateError } = await supabase
      .from('golfers')
      .update({ salary_pennies: newSalary })
      .eq('id', golfer.id);
      
    if (!updateError) {
      updated++;
      if (updated % 50 === 0) {
        process.stdout.write(`   Updated ${updated}/${golfers.length}...\r`);
      }
    }
  }
  
  console.log('');
  console.log(`✅ Updated ${updated} golfers`);
  console.log('');
  console.log('📊 Salary Distribution Summary:');
  
  const premium = golfers.filter(g => (g.world_ranking || 999) <= 10).length;
  const highValue = golfers.filter(g => {
    const r = g.world_ranking || 999;
    return r > 10 && r <= 50;
  }).length;
  const midTier = golfers.filter(g => {
    const r = g.world_ranking || 999;
    return r > 50 && r <= 100;
  }).length;
  const value = golfers.filter(g => (g.world_ranking || 999) > 100).length;
  
  console.log(`   Premium (£12k-£15k):  ${premium} golfers`);
  console.log(`   High-Value (£9k-£12k): ${highValue} golfers`);
  console.log(`   Mid-Tier (£7k-£9k):   ${midTier} golfers`);
  console.log(`   Value (<£7k):         ${value} golfers`);
  console.log('');
  console.log('✅ MIGRATION COMPLETE!');
  console.log('💰 Salary Cap: £60,000 (6,000,000 pennies)');
  console.log('');
  console.log('🚀 Next: Restart your dev server');
  console.log('   pnpm dev:golf');
  console.log('');
}

updateSalaries().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
