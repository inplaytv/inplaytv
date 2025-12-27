require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSync() {
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('name, registration_opens_at, registration_closes_at, round1_tee_time, status')
    .in('name', ['Mister G\'s Open', 'THE THANET OPEN', 'THE GREENIDGE OPEN'])
    .order('name');
  
  console.log('=== LIFECYCLE MANAGER (tournaments table) ===');
  tournaments.forEach(t => {
    console.log(`\n${t.name} (${t.status}):`);
    console.log('  Registration Opens:', t.registration_opens_at);
    console.log('  Registration Closes:', t.registration_closes_at);
    console.log('  Round 1 Tee Time:', t.round1_tee_time);
  });
  
  console.log('\n\n=== COMPETITIONS (tournament_competitions table) ===');
  for (const tournament of tournaments) {
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('competition_types(name), status, reg_open_at, reg_close_at, start_at')
      .eq('tournament_id', (await supabase.from('tournaments').select('id').eq('name', tournament.name).single()).data.id);
    
    console.log(`\n${tournament.name}:`);
    comps.forEach(c => {
      console.log(`  ${c.competition_types.name}:`);
      console.log(`    Status: ${c.status}`);
      console.log(`    Reg Open: ${c.reg_open_at}`);
      console.log(`    Reg Close: ${c.reg_close_at}`);
      console.log(`    Start: ${c.start_at}`);
      
      // Check if times match tournament
      const regCloseMatch = c.reg_close_at === tournament.registration_closes_at ? '✅' : '❌ MISMATCH';
      const regOpenMatch = c.reg_open_at === tournament.registration_opens_at ? '✅' : '❌ MISMATCH';
      console.log(`    Reg Open Match: ${regOpenMatch}`);
      console.log(`    Reg Close Match: ${regCloseMatch}`);
    });
  }
  
  console.log('\n\n=== CURRENT TIME CHECK ===');
  const now = new Date();
  console.log('Current UTC time:', now.toISOString());
}

checkSync().catch(console.error);
