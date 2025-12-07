require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== COMPREHENSIVE TOURNAMENT TIMING CHECK ===\n');
  
  // Get all active tournaments with their competitions
  const { data: tournaments } = await client
    .from('tournaments')
    .select(`
      id,
      name,
      slug,
      status,
      round_1_start,
      round_2_start,
      round_3_start,
      round_4_start,
      current_round
    `)
    .in('status', ['upcoming', 'registration_open', 'registration_closed', 'live'])
    .order('start_date');
  
  const issues = [];
  const correct = [];
  
  for (const tournament of tournaments) {
    const { data: comps } = await client
      .from('tournament_competitions')
      .select(`
        id,
        reg_open_at,
        reg_close_at,
        status,
        competition_types (name, slug)
      `)
      .eq('tournament_id', tournament.id);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${tournament.name}`);
    console.log(`   Status: ${tournament.status} | Current Round: ${tournament.current_round || 'N/A'}`);
    console.log(`   Round Starts: 1=${tournament.round_1_start?.substring(0,16)} 2=${tournament.round_2_start?.substring(0,16)} 3=${tournament.round_3_start?.substring(0,16)} 4=${tournament.round_4_start?.substring(0,16)}`);
    
    for (const comp of comps) {
      const compType = comp.competition_types;
      let expectedRoundStart = null;
      let correctRegClose = null;
      
      // Determine which round this competition should close before
      switch (compType.slug) {
        case 'final-strike':
          expectedRoundStart = tournament.round_4_start;
          break;
        case 'first-to-strike':
        case 'beat-the-cut':
        case 'full-course':
          expectedRoundStart = tournament.round_1_start;
          break;
        case 'the-weekender':
          expectedRoundStart = tournament.round_3_start;
          break;
      }
      
      if (expectedRoundStart) {
        correctRegClose = new Date(new Date(expectedRoundStart).getTime() - 15 * 60 * 1000).toISOString();
        // Compare as timestamps, not strings (to handle timezone format differences)
        const currentTime = new Date(comp.reg_close_at).getTime();
        const expectedTime = new Date(correctRegClose).getTime();
        const isCorrect = currentTime === expectedTime;
        const now = new Date();
        const regCloseDate = new Date(comp.reg_close_at);
        const isClosed = regCloseDate < now;
        
        if (isCorrect) {
          console.log(`   ✅ ${compType.name}: ${comp.reg_close_at} (${isClosed ? 'CLOSED' : 'OPEN'})`);
          correct.push({
            tournament: tournament.name,
            competition: compType.name,
            reg_close_at: comp.reg_close_at
          });
        } else {
          console.log(`   ❌ ${compType.name}:`);
          console.log(`      Current:  ${comp.reg_close_at}`);
          console.log(`      Expected: ${correctRegClose}`);
          console.log(`      Round:    ${expectedRoundStart}`);
          issues.push({
            tournament: tournament.name,
            tournament_slug: tournament.slug,
            competition: compType.name,
            competition_slug: compType.slug,
            competition_id: comp.id,
            current_reg_close: comp.reg_close_at,
            correct_reg_close: correctRegClose,
            round_start: expectedRoundStart
          });
        }
      } else {
        console.log(`   ⚠️  ${compType.name}: No round start date available`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Correct: ${correct.length}`);
  console.log(`❌ Issues Found: ${issues.length}`);
  
  if (issues.length > 0) {
    console.log('\n❌ ISSUES TO FIX:');
    console.table(issues.map(i => ({
      Tournament: i.tournament.substring(0, 30),
      Competition: i.competition,
      Current: i.current_reg_close,
      Expected: i.correct_reg_close
    })));
    
    // Save issues to file for fixing
    const fs = require('fs');
    fs.writeFileSync(
      require('path').join(__dirname, 'timing-issues.json'),
      JSON.stringify(issues, null, 2)
    );
    console.log('\n💾 Issues saved to: scripts/timing-issues.json');
  } else {
    console.log('\n🎉 All tournaments have correct registration close times!');
  }
})().catch(console.error);
