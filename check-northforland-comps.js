require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  console.log('\n=== CHECKING NORTHFORLAND OPEN ===\n');
  
  // 1. Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, status')
    .eq('slug', 'northforland-open')
    .single();
  
  if (!tournament) {
    console.log('Tournament not found!');
    return;
  }
  
  console.log('Tournament:', tournament.name);
  console.log('Tournament Status:', tournament.status);
  console.log('Tournament ID:', tournament.id);
  
  // 2. Get ALL competitions for this tournament (no status filter)
  const { data: allComps } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      start_at,
      competition_format,
      competition_types (name, slug)
    `)
    .eq('tournament_id', tournament.id)
    .eq('competition_format', 'inplay');
  
  console.log('\n--- ALL InPlay Competitions (no filter) ---');
  console.log('Total found:', allComps?.length || 0);
  
  if (allComps && allComps.length > 0) {
    const now = new Date();
    allComps.forEach(c => {
      const regCloseAt = c.reg_close_at ? new Date(c.reg_close_at) : null;
      const isRegClosed = regCloseAt ? now >= regCloseAt : true;
      
      console.log(`\n${c.competition_types.name}:`);
      console.log('  Status:', c.status);
      console.log('  Reg Close:', c.reg_close_at);
      console.log('  Reg Closed?:', isRegClosed ? 'YES (closed)' : 'NO (still open)');
    });
  }
  
  // 3. Try the EXACT API filter used in route.ts
  const { data: apiFilteredComps } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      competition_types (name)
    `)
    .eq('tournament_id', tournament.id)
    .eq('competition_format', 'inplay')
    .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live']);
  
  console.log('\n--- Competitions with API status filter ---');
  console.log('Filter: .in(\'status\', [\'upcoming\', \'reg_open\', \'reg_closed\', \'live\'])');
  console.log('Results:', apiFilteredComps?.length || 0);
  
  if (apiFilteredComps && apiFilteredComps.length > 0) {
    apiFilteredComps.forEach(c => {
      console.log('  -', c.competition_types.name, '→', c.status);
    });
  } else {
    console.log('  (NONE - This is why the page is empty!)');
  }
  
  // 4. Check what status values exist across ALL tournaments
  console.log('\n--- All unique status values in database ---');
  const { data: allStatuses } = await supabase
    .from('tournament_competitions')
    .select('status')
    .eq('competition_format', 'inplay');
  
  const uniqueStatuses = [...new Set(allStatuses?.map(c => c.status) || [])];
  console.log('Unique status values:', uniqueStatuses);
  
})();
