require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  console.log('Checking tournaments and competitions...\n');
  
  // Get tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .order('name');
  
  console.log(`📊 TOURNAMENTS: ${tournaments?.length || 0}`);
  tournaments?.forEach((t, i) => {
    console.log(`  ${i+1}. ${t.name} (${t.status})`);
  });
  
  // Get competitions
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select('id, tournament_id, status, competition_types(name)');
  
  console.log(`\n🏆 COMPETITIONS: ${competitions?.length || 0}`);
  
  // Group by tournament
  const grouped = {};
  competitions?.forEach(comp => {
    const tid = comp.tournament_id;
    if (!grouped[tid]) grouped[tid] = [];
    grouped[tid].push(comp);
  });
  
  console.log('\n📋 COMPETITIONS BY TOURNAMENT:');
  tournaments?.forEach(t => {
    const comps = grouped[t.id] || [];
    console.log(`\n  ${t.name}: ${comps.length} competitions`);
    comps.forEach(c => {
      console.log(`    - ${c.competition_types?.name || 'Unknown'} (${c.status})`);
    });
  });
}

checkData();
