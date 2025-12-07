require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING CROWN AUSTRALIAN OPEN TEE TIMES ===\n');
  
  const { data: tournament } = await client
    .from('tournaments')
    .select('*')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('Tournament Timezone:', tournament.timezone);
  console.log('\nDatabase round starts (UTC):');
  console.log('Round 1:', tournament.round_1_start);
  console.log('Round 2:', tournament.round_2_start);
  console.log('Round 3:', tournament.round_3_start);
  console.log('Round 4:', tournament.round_4_start);
  
  console.log('\nOld column (round1_tee_time):', tournament.round1_tee_time);
  
  // Calculate correct UTC time for 7:09 AM Australia/Sydney on Dec 7
  // Australia/Sydney is UTC+11 during summer (AEDT)
  // 7:09 AM Dec 7 Sydney = 8:09 PM Dec 6 UTC
  const correctR4UTC = '2025-12-06T20:09:00+00:00';
  
  console.log('\n=== CORRECT TIME CALCULATION ===');
  console.log('First tee: 7:09 AM Saturday Dec 7, 2025 (Australia/Sydney)');
  console.log('Sydney timezone: UTC+11 (AEDT - Australian Eastern Daylight Time)');
  console.log('Correct UTC time:', correctR4UTC, '(Friday Dec 6, 8:09 PM UTC)');
  
  const now = new Date();
  const correctTime = new Date(correctR4UTC);
  const hoursUntil = (correctTime - now) / 1000 / 60 / 60;
  
  console.log('\nCurrent UTC:', now.toISOString());
  console.log('Hours until first tee:', hoursUntil.toFixed(2));
  
  // Check what the database currently has
  const dbTime = new Date(tournament.round_4_start);
  const dbHoursUntil = (dbTime - now) / 1000 / 60 / 60;
  
  console.log('\n=== DATABASE CURRENT VALUE ===');
  console.log('Database has:', tournament.round_4_start);
  console.log('Hours until DB time:', dbHoursUntil.toFixed(2));
  console.log('Difference:', (dbHoursUntil - hoursUntil).toFixed(2), 'hours OFF');
  
  if (Math.abs(dbHoursUntil - hoursUntil) > 1) {
    console.log('\n❌ DATABASE TIME IS WRONG!');
    console.log('Should be:', correctR4UTC);
  } else {
    console.log('\n✅ Database time is correct');
  }
})().catch(console.error);
