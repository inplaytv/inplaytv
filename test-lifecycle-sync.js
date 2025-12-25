/**
 * Test script to verify lifecycle manager properly syncs to competitions
 * 
 * Run: node test-lifecycle-sync.js
 */

require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testLifecycleSync() {
  console.log('🔍 Testing Lifecycle Manager → Competition Sync\n');

  // 1. Get a tournament with competitions
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      registration_opens_at,
      registration_closes_at,
      round1_tee_time,
      round2_tee_time,
      round3_tee_time,
      round4_tee_time,
      end_date
    `)
    .limit(1);

  if (!tournaments || tournaments.length === 0) {
    console.log('❌ No tournaments found');
    return;
  }

  const tournament = tournaments[0];
  console.log(`📅 Tournament: ${tournament.name}`);
  console.log(`   Registration: ${tournament.registration_opens_at} → ${tournament.registration_closes_at}`);
  console.log(`   Round 1 Tee Time: ${tournament.round1_tee_time}`);
  console.log(`   Tournament Ends: ${tournament.end_date}\n`);

  // 2. Get competitions for this tournament
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      status,
      competition_types (name, round_start)
    `)
    .eq('tournament_id', tournament.id);

  if (!competitions || competitions.length === 0) {
    console.log('⚠️  No competitions found for this tournament');
    return;
  }

  console.log(`🏆 Found ${competitions.length} competitions:\n`);

  for (const comp of competitions) {
    console.log(`   ${comp.competition_types.name} (Round ${comp.competition_types.round_start})`);
    console.log(`   ├─ Reg Opens:  ${comp.reg_open_at}`);
    console.log(`   ├─ Reg Closes: ${comp.reg_close_at}`);
    console.log(`   ├─ Starts:     ${comp.start_at}`);
    console.log(`   ├─ Ends:       ${comp.end_at}`);
    console.log(`   └─ Status:     ${comp.status}`);
    
    // Check if values match lifecycle
    const regOpenMatch = comp.reg_open_at === tournament.registration_opens_at;
    const startMatch = comp.start_at === tournament[`round${comp.competition_types.round_start}_tee_time`];
    const endMatch = comp.end_at === tournament.end_date;
    
    if (!regOpenMatch) console.log(`      ⚠️  reg_open_at doesn't match tournament.registration_opens_at`);
    if (!startMatch) console.log(`      ⚠️  start_at doesn't match round${comp.competition_types.round_start}_tee_time`);
    if (!endMatch) console.log(`      ⚠️  end_at doesn't match tournament.end_date`);
    
    // Check if reg_close_at is 15 mins before start_at
    if (comp.start_at && comp.reg_close_at) {
      const startTime = new Date(comp.start_at).getTime();
      const closeTime = new Date(comp.reg_close_at).getTime();
      const diff = (startTime - closeTime) / 60000; // minutes
      
      if (Math.abs(diff - 15) > 1) {
        console.log(`      ⚠️  reg_close_at is ${diff.toFixed(0)} mins before start (should be 15 mins)`);
      }
    }
    
    console.log('');
  }

  console.log('\n✅ Sync check complete!');
  console.log('\nTo trigger a full sync, call:');
  console.log(`POST /api/tournaments/${tournament.id}/competitions/calculate-times`);
}

testLifecycleSync()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
