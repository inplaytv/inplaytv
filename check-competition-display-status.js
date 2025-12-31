require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('slug', 'northforland-open-tournament')
    .single();
  
  if (!tournament) {
    console.log('Tournament not found');
    return;
  }
  
  const { data: comps } = await supabase
    .from('tournament_competitions')
    .select(`
      competition_types(name),
      reg_close_at,
      start_at,
      end_at,
      status
    `)
    .eq('tournament_id', tournament.id)
    .eq('competition_format', 'inplay');
  
  const now = new Date();
  console.log('\n=== Competition Status Analysis ===');
  console.log('Current Time:', now.toISOString());
  console.log('');
  
  comps.forEach(c => {
    const name = c.competition_types?.name || 'Unknown';
    const regClose = c.reg_close_at ? new Date(c.reg_close_at) : null;
    const start = c.start_at ? new Date(c.start_at) : null;
    
    const regClosed = regClose && now >= regClose;
    const hasStarted = start && now >= start;
    
    console.log(`${name}:`);
    console.log(`  DB Status: "${c.status}"`);
    console.log(`  Reg Close: ${c.reg_close_at} ${regClosed ? '✗ CLOSED' : '✓ OPEN'}`);
    console.log(`  Start At:  ${c.start_at || 'NULL'} ${hasStarted ? '✓ STARTED' : '✗ NOT STARTED'}`);
    
    let shouldShow;
    if (!regClosed) {
      shouldShow = '🟢 REGISTRATION OPEN';
    } else if (hasStarted) {
      shouldShow = '🔴 LIVE';
    } else {
      shouldShow = '🟡 AWAITING START';
    }
    console.log(`  Display: ${shouldShow}`);
    console.log('');
  });
})();
