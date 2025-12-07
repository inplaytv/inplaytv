require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: tournament, error: tErr } = await client
    .from('tournaments')
    .select('id, name, slug, round_1_start, round_2_start, round_3_start, round_4_start, current_round')
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .single();
  
  if (tErr) {
    console.error('Tournament error:', tErr);
    return;
  }
  
  console.log('=== NEDBANK TOURNAMENT ===');
  console.log(JSON.stringify(tournament, null, 2));
  
  const { data: comps, error: cErr } = await client
    .from('tournament_competitions')
    .select(`
      id, 
      reg_open_at, 
      reg_close_at, 
      start_at, 
      end_at, 
      status,
      competition_types(name)
    `)
    .eq('tournament_id', tournament.id)
    .order('start_at');
  
  if (cErr) {
    console.error('Competitions error:', cErr);
    return;
  }
  
  console.log('\n=== COMPETITIONS ===');
  console.log(JSON.stringify(comps, null, 2));
  
  const now = new Date();
  console.log('\n=== CURRENT TIME ===');
  console.log(now.toISOString());
  
  // Check Final Strike specifically
  const finalStrike = comps.find(c => c.competition_types.name === 'Final Strike');
  if (finalStrike && tournament.round_4_start) {
    const round4Start = new Date(tournament.round_4_start);
    const regClose = new Date(finalStrike.reg_close_at);
    const expectedClose = new Date(round4Start.getTime() - 15 * 60 * 1000); // 15 min before
    
    console.log('\n=== FINAL STRIKE TIMING ===');
    console.log('Round 4 Start:', round4Start.toISOString());
    console.log('Expected Reg Close (15 min before):', expectedClose.toISOString());
    console.log('Actual Reg Close in DB:', regClose.toISOString());
    console.log('Difference (minutes):', (regClose - expectedClose) / 1000 / 60);
    console.log('Hours until Round 4:', (round4Start - now) / 1000 / 60 / 60);
  }
})().catch(console.error);
