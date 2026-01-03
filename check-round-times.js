require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRoundTimes() {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'the-greenidge-open')
    .single();
  
  console.log('THE GREENIDGE OPEN Round Tee Times:');
  console.log('  Round 1:', tournament?.round_1_start || 'Not set');
  console.log('  Round 2:', tournament?.round_2_start || 'Not set');
  console.log('  Round 3:', tournament?.round_3_start || 'Not set');
  console.log('  Round 4:', tournament?.round_4_start || 'Not set');
}

checkRoundTimes().then(() => process.exit(0));
