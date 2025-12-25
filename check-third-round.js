require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkThirdRound() {
  // Get THE THANET OPEN tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, start_date, end_date')
    .eq('name', 'THE THANET OPEN')
    .single();

  console.log('\n=== TOURNAMENT ===');
  console.log('Name:', tournament.name);
  console.log('Start:', tournament.start_date);
  console.log('End:', tournament.end_date);

  // Get all competitions
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      created_at,
      competition_types(name)
    `)
    .eq('tournament_id', tournament.id)
    .order('created_at', { ascending: false });

  console.log('\n=== COMPETITIONS ===');
  competitions.forEach((comp, i) => {
    console.log(`\n${i + 1}. ${comp.competition_types.name}`);
    console.log('   Status:', comp.status);
    console.log('   Reg Open:', comp.reg_open_at || 'NOT SET');
    console.log('   Reg Close:', comp.reg_close_at || 'NOT SET');
    console.log('   Comp Start:', comp.start_at || 'NOT SET');
    console.log('   Comp End:', comp.end_at || 'NOT SET');
    console.log('   Created:', comp.created_at);
  });

  const now = new Date();
  console.log('\n=== CURRENT TIME ===');
  console.log('Now:', now.toISOString());
}

checkThirdRound().catch(console.error);
