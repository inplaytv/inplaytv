require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING ONE 2 ONE COMPETITIONS ===\n');
  
  // Get all active tournaments
  const { data: tournaments } = await client
    .from('tournaments')
    .select('id, name, slug, round_1_start, round_2_start, round_3_start, round_4_start')
    .in('status', ['live', 'registration_open', 'registration_closed', 'upcoming'])
    .order('name');
  
  for (const tournament of tournaments) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📍 ${tournament.name}`);
    
    // Get ONE 2 ONE templates for this tournament
    const { data: templates } = await client
      .from('competition_templates')
      .select('id, name, rounds_covered, reg_close_round, is_active')
      .eq('tournament_id', tournament.id)
      .is('competition_type_id', null)  // ONE 2 ONE templates have null competition_type_id
      .eq('is_active', true);
    
    if (!templates || templates.length === 0) {
      console.log('   ⚠️  No ONE 2 ONE templates found');
      continue;
    }
    
    console.log(`   Found ${templates.length} ONE 2 ONE templates`);
    
    for (const template of templates) {
      const roundsCovered = template.rounds_covered || [];
      const regCloseRound = template.reg_close_round;
      
      // Determine which round start time to use for reg close
      let roundStartTime = null;
      let roundLabel = '';
      
      if (regCloseRound === 1) {
        roundStartTime = tournament.round_1_start;
        roundLabel = 'Round 1';
      } else if (regCloseRound === 2) {
        roundStartTime = tournament.round_2_start;
        roundLabel = 'Round 2';
      } else if (regCloseRound === 3) {
        roundStartTime = tournament.round_3_start;
        roundLabel = 'Round 3';
      } else if (regCloseRound === 4) {
        roundStartTime = tournament.round_4_start;
        roundLabel = 'Round 4';
      }
      
      if (roundStartTime) {
        const roundStart = new Date(roundStartTime);
        const expectedRegClose = new Date(roundStart.getTime() - 15 * 60 * 1000);
        const now = new Date();
        const hoursUntilClose = (expectedRegClose - now) / 1000 / 60 / 60;
        const isOpen = expectedRegClose > now;
        
        console.log(`\n   ${template.name}:`);
        console.log(`      Rounds: ${roundsCovered.join(', ')}`);
        console.log(`      Closes before: ${roundLabel}`);
        console.log(`      ${roundLabel} starts: ${roundStartTime}`);
        console.log(`      Reg closes at: ${expectedRegClose.toISOString()} (15 min before)`);
        console.log(`      Status: ${isOpen ? '✅ OPEN' : '❌ CLOSED'}`);
        console.log(`      Hours until close: ${hoursUntilClose.toFixed(2)}`);
      } else {
        console.log(`\n   ${template.name}:`);
        console.log(`      ⚠️  No round start time for close round ${regCloseRound}`);
      }
    }
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ ONE 2 ONE timing check complete!');
})().catch(console.error);
