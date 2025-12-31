require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  console.log('\n=== CHECKING WHAT THE PAGE SEES ===\n');
  
  const { data: t } = await supabase
    .from('tournaments')
    .select('id, name, round_1_start, round_2_start, round_3_start, round_4_start, registration_closes_at')
    .eq('slug', 'northforland-open-tournament')
    .single();
  
  if (!t) {
    console.log('Not found');
    return;
  }
  
  console.log('Tournament Round Tee Times FROM LIFECYCLE:');
  console.log('  Round 1:', t.round_1_start);
  console.log('  Round 2:', t.round_2_start);
  console.log('  Round 3:', t.round_3_start);
  console.log('  Round 4:', t.round_4_start);
  console.log('  Tournament Reg Closes:', t.registration_closes_at);
  
  console.log('\n=== Competition Times SAVED IN DATABASE ===');
  
  const { data: comps } = await supabase
    .from('tournament_competitions')
    .select('competition_types(name, round_start), start_at, reg_close_at, status')
    .eq('tournament_id', t.id)
    .eq('competition_format', 'inplay');
  
  const now = new Date();
  
  comps.forEach(c => {
    const startAt = c.start_at ? new Date(c.start_at) : null;
    const regClose = c.reg_close_at ? new Date(c.reg_close_at) : null;
    const hasStarted = startAt && now >= startAt;
    const regClosed = regClose && now >= regClose;
    
    const roundStart = c.competition_types?.round_start;
    const expectedTeeTime = roundStart ? t[`round_${roundStart}_start`] : null;
    
    console.log(`\n${c.competition_types.name}:`);
    console.log('  Should use: Round', roundStart, 'tee time =', expectedTeeTime);
    console.log('  Actually has: start_at =', c.start_at, hasStarted ? '(STARTED)' : '(NOT YET)');
    console.log('  reg_close_at:', c.reg_close_at, regClosed ? '(CLOSED)' : '(OPEN)');
    console.log('  DB Status:', c.status);
    console.log('  MISMATCH?', c.start_at !== expectedTeeTime ? 'YES - NEEDS SYNC!' : 'No, correct');
  });
  
  console.log('\n=== SOLUTION ===');
  console.log('Competitions have WRONG start times saved in database!');
  console.log('They need to be synced from tournament round tee times.');
  console.log('Run the sync API or re-save competitions in admin to update.');
})();
