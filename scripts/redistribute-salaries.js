require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function redistributeSalaries() {
  console.log('📊 Fetching all golfers...');
  
  const { data: golfers, error: fetchError } = await supabase
    .from('golfers')
    .select('id, full_name, salary_pennies')
    .order('full_name');
    
  if (fetchError) {
    console.error('❌ Error:', fetchError);
    process.exit(1);
  }
  
  console.log(`✅ Found ${golfers.length} golfers`);
  console.log('🔄 Redistributing salaries evenly across tiers...');
  console.log('');
  
  // Sort by current salary to maintain some consistency
  golfers.sort((a, b) => (b.salary_pennies || 0) - (a.salary_pennies || 0));
  
  let updated = 0;
  const totalGolfers = golfers.length;
  
  // Distribute evenly:
  // Top 10%: Premium (£12k-£15k)
  // Next 20%: High-Value (£9k-£12k)  
  // Next 30%: Mid-Tier (£7k-£9k)
  // Bottom 40%: Value (£5k-£7k)
  
  for (let i = 0; i < golfers.length; i++) {
    const golfer = golfers[i];
    let newSalary;
    const percentile = i / totalGolfers;
    
    if (percentile < 0.10) {
      // Top 10%: Premium £12,000 - £15,000
      newSalary = 1200000 + Math.floor(Math.random() * 300000);
    } else if (percentile < 0.30) {
      // Next 20%: High-Value £9,000 - £11,999
      newSalary = 900000 + Math.floor(Math.random() * 299900);
    } else if (percentile < 0.60) {
      // Next 30%: Mid-Tier £7,000 - £8,999
      newSalary = 700000 + Math.floor(Math.random() * 199900);
    } else {
      // Bottom 40%: Value £5,000 - £6,999
      newSalary = 500000 + Math.floor(Math.random() * 199900);
    }
    
    const { error: updateError } = await supabase
      .from('golfers')
      .update({ salary_pennies: newSalary })
      .eq('id', golfer.id);
      
    if (!updateError) {
      updated++;
      if (updated % 50 === 0) {
        process.stdout.write(`   Updated ${updated}/${totalGolfers}...\r`);
      }
    }
  }
  
  console.log('');
  console.log(`✅ Updated ${updated} golfers`);
  console.log('');
  console.log('📊 New Salary Distribution:');
  
  const premiumCount = Math.floor(totalGolfers * 0.10);
  const highValueCount = Math.floor(totalGolfers * 0.20);
  const midTierCount = Math.floor(totalGolfers * 0.30);
  const valueCount = totalGolfers - premiumCount - highValueCount - midTierCount;
  
  console.log(`   Premium (£12k-£15k):  ${premiumCount} golfers (~10%)`);
  console.log(`   High-Value (£9k-£12k): ${highValueCount} golfers (~20%)`);
  console.log(`   Mid-Tier (£7k-£9k):   ${midTierCount} golfers (~30%)`);
  console.log(`   Value (<£7k):         ${valueCount} golfers (~40%)`);
  console.log('');
  console.log('🎯 Team Building Economics:');
  console.log('   6 Premium players = £78k-£90k (OVER BUDGET)');
  console.log('   Typical team: 1-2 premium, 2-3 mid, 2-3 value = £55k-£59k');
  console.log('');
  console.log('✅ REDISTRIBUTION COMPLETE!');
  console.log('💰 Salary Cap: £60,000 requires strategic choices');
  console.log('');
  console.log('🚀 Restart dev server: pnpm dev:golf');
}

redistributeSalaries().catch(err => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
