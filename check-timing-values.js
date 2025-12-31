require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTiming() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('start_date, end_date, registration_opens_at, registration_closes_at, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time')
    .eq('id', '843e4121-7e22-48c0-a7f3-fcffe96982d5')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== DATABASE VALUES ===');
  console.log('Start Date:      ', data.start_date);
  console.log('End Date:        ', data.end_date);
  console.log('Reg Opens At:    ', data.registration_opens_at);
  console.log('Reg Closes At:   ', data.registration_closes_at);
  console.log('\nRound Tee Times:');
  console.log('Round 1:         ', data.round1_tee_time);
  console.log('Round 2:         ', data.round2_tee_time);
  console.log('Round 3:         ', data.round3_tee_time);
  console.log('Round 4:         ', data.round4_tee_time);
}

checkTiming();
