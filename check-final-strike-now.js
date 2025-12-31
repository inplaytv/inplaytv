require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkNow() {
  console.log('🔍 Current State Check\n');
  
  const { data: allComps } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      start_at,
      reg_close_at,
      competition_types (name, round_start),
      tournaments (name, round_1_start, round_2_start, round_3_start, round_4_start)
    `);
    
  if (!allComps || allComps.length === 0) {
    console.log('❌ No competitions found');
    return;
  }
  
  console.log(`Found ${allComps.length} competition(s):\n`);
  
  allComps.forEach((comp, i) => {
    console.log(`${i + 1}. Tournament: ${comp.tournaments?.name}`);
    console.log(`   ID: ${comp.id}`);
    console.log(`   Database status: ${comp.status}`);
    console.log(`   start_at: ${comp.start_at}`);
    console.log(`   reg_close_at: ${comp.reg_close_at}`);
    console.log(`   Should use Round ${comp.competition_types?.round_start} tee time`);
    
    const roundField = `round_${comp.competition_types?.round_start}_start`;
    const correctTeeTime = comp.tournaments?.[roundField];
    console.log(`   Correct tee time: ${correctTeeTime}`);
    
    const isCorrect = comp.start_at === correctTeeTime;
    console.log(`   Status: ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
    
    const now = new Date();
    const startAt = new Date(comp.start_at);
    const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    
    console.log(`\n   Current time: ${now.toISOString()}`);
    console.log(`   Competition starts: ${comp.start_at}`);
    console.log(`   Time until start: ${Math.round((startAt - now) / (1000 * 60 * 60))} hours`);
    
    if (regCloseAt) {
      console.log(`   Registration closes: ${comp.reg_close_at}`);
      console.log(`   Time until reg close: ${Math.round((regCloseAt - now) / (1000 * 60 * 60))} hours`);
      
      if (now >= regCloseAt && now < startAt) {
        console.log(`   ✅ Should show: "AWAITING START" (reg closed, comp not started)`);
      } else if (now >= startAt) {
        console.log(`   ✅ Should show: "LIVE" (comp started)`);
      } else {
        console.log(`   ✅ Should show: "REGISTRATION OPEN" (reg still open)`);
      }
    }
    console.log('');
  });
}

checkNow().catch(console.error);
