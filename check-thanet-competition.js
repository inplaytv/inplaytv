require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetition() {
  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', 'the-thanet-open')
    .single();
  
  console.log('\n📍 Tournament:', tournament);
  
  // Get competitions
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      competition_types(name)
    `)
    .eq('tournament_id', tournament.id);
  
  console.log('\n🏆 Competitions:');
  competitions.forEach(comp => {
    console.log(`  - ${comp.competition_types.name}`);
    console.log(`    Status: ${comp.status}`);
    console.log(`    Reg Opens: ${comp.reg_open_at}`);
    console.log(`    Reg Closes: ${comp.reg_close_at}`);
    console.log(`    Current Time: ${new Date().toISOString()}`);
    
    const now = new Date();
    const regClose = new Date(comp.reg_close_at);
    console.log(`    Time until close: ${Math.round((regClose - now) / 1000 / 60)} minutes\n`);
  });
}

checkCompetition();
