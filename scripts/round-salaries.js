require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function roundSalaries() {
  console.log('🔄 Rounding all golfer salaries to nearest £100...\n');

  // Fetch all golfers
  const { data: golfers, error } = await supabase
    .from('golfers')
    .select('id, full_name, salary_pennies');

  if (error) {
    console.error('❌ Error fetching golfers:', error.message);
    return;
  }

  console.log(`Found ${golfers.length} golfers\n`);

  let updated = 0;
  let unchanged = 0;

  for (const golfer of golfers) {
    const currentSalary = golfer.salary_pennies || 0;
    
    // Round to nearest 10,000 pennies (£100)
    const roundedSalary = Math.round(currentSalary / 10000) * 10000;
    
    if (roundedSalary !== currentSalary) {
      const { error: updateError } = await supabase
        .from('golfers')
        .update({ salary_pennies: roundedSalary })
        .eq('id', golfer.id);

      if (updateError) {
        console.error(`❌ Error updating ${golfer.full_name}:`, updateError.message);
      } else {
        console.log(`✓ ${golfer.full_name}: £${(currentSalary / 100).toFixed(2)} → £${(roundedSalary / 100).toLocaleString()}`);
        updated++;
      }
    } else {
      unchanged++;
    }
  }

  console.log(`\n✅ Complete!`);
  console.log(`   Updated: ${updated} golfers`);
  console.log(`   Unchanged: ${unchanged} golfers`);
  console.log(`\n💡 Example rounded salaries:`);
  console.log(`   £8,144.47 → £8,100`);
  console.log(`   £5,931.46 → £5,900`);
  console.log(`   £14,456.32 → £14,500`);
}

roundSalaries();
