require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseTiming() {
  console.log('🔍 Checking competition timing issues...\n');
  
  // Get Thanet Open tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time, registration_opens_at')
    .ilike('name', '%thanet%')
    .single();
  
  if (!tournament) {
    console.log('❌ Tournament not found');
    return;
  }
  
  console.log(`Tournament: ${tournament.name}`);
  console.log(`Round 1 Tee Time: ${tournament.round1_tee_time || 'NOT SET'}`);
  console.log(`Round 2 Tee Time: ${tournament.round2_tee_time || 'NOT SET'}`);
  console.log(`Round 3 Tee Time: ${tournament.round3_tee_time || 'NOT SET'}`);
  console.log(`Round 4 Tee Time: ${tournament.round4_tee_time || 'NOT SET'}`);
  console.log(`Registration Opens: ${tournament.registration_opens_at}\n`);
  
  // Get all competitions
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      name,
      status,
      start_at,
      reg_close_at,
      competition_types (
        name,
        rounds_covered
      )
    `)
    .eq('tournament_id', tournament.id)
    .order('created_at');
  
  console.log('📋 Competition Timing Analysis:\n');
  
  let issuesFound = 0;
  
  for (const comp of competitions) {
    const typeName = comp.competition_types?.name || comp.name;
    const roundsCovered = comp.competition_types?.rounds_covered || [];
    const firstRound = roundsCovered[0];
    
    console.log(`\n${typeName} (${comp.status})`);
    console.log(`  Covers: Round${roundsCovered.length > 1 ? 's' : ''} ${roundsCovered.join(', ')}`);
    console.log(`  Current start_at: ${comp.start_at || 'NOT SET'}`);
    console.log(`  Current reg_close_at: ${comp.reg_close_at || 'NOT SET'}`);
    
    // Determine what start_at SHOULD be
    let expectedStartAt = null;
    if (firstRound === 1) expectedStartAt = tournament.round1_tee_time;
    else if (firstRound === 2) expectedStartAt = tournament.round2_tee_time;
    else if (firstRound === 3) expectedStartAt = tournament.round3_tee_time;
    else if (firstRound === 4) expectedStartAt = tournament.round4_tee_time;
    
    if (expectedStartAt) {
      const expectedRegClose = new Date(new Date(expectedStartAt).getTime() - 15 * 60000).toISOString();
      
      console.log(`  Expected start_at: ${expectedStartAt}`);
      console.log(`  Expected reg_close_at: ${expectedRegClose}`);
      
      const startCorrect = comp.start_at === expectedStartAt;
      const regCloseCorrect = comp.reg_close_at === expectedRegClose;
      
      if (!startCorrect || !regCloseCorrect) {
        console.log(`  ❌ TIMING ISSUE FOUND!`);
        if (!startCorrect) console.log(`     - start_at is wrong`);
        if (!regCloseCorrect) console.log(`     - reg_close_at is wrong`);
        issuesFound++;
      } else {
        console.log(`  ✓ Timing correct`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  if (issuesFound > 0) {
    console.log(`\n⚠️  Found ${issuesFound} competition(s) with timing issues!`);
    console.log('\n📝 To fix these issues:\n');
    console.log('1. Open Supabase SQL Editor');
    console.log('2. Run: scripts/fix-final-strike-timing.sql');
    console.log('3. Then run: scripts/create-competition-sync-trigger.sql');
    console.log('\nThe trigger will prevent this from happening in the future.');
  } else {
    console.log('\n✅ All competition timings are correct!');
  }
}

diagnoseTiming().catch(console.error);
