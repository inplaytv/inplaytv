require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Fetching tournament data...\n');
  
  // Get all tournaments
  const { data: tournaments, error: tError } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, start_date, end_date, is_visible')
    .order('start_date');
  
  if (tError) {
    console.error('Error fetching tournaments:', tError);
    return;
  }
  
  console.log('='.repeat(80));
  console.log('TOURNAMENTS:');
  console.log('='.repeat(80));
  tournaments.forEach(t => {
    console.log(`\n${t.name}`);
    console.log(`  Slug: ${t.slug}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Visible: ${t.is_visible}`);
    console.log(`  Dates: ${t.start_date} to ${t.end_date}`);
  });
  
  // Get all InPlay competitions
  const { data: competitions, error: cError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      tournament_id,
      status,
      reg_open_at,
      reg_close_at,
      competition_format,
      competition_types(name)
    `)
    .eq('competition_format', 'inplay')
    .order('tournament_id');
  
  if (cError) {
    console.error('Error fetching competitions:', cError);
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('INPLAY COMPETITIONS BY TOURNAMENT:');
  console.log('='.repeat(80));
  
  const grouped = {};
  competitions.forEach(c => {
    const tournament = tournaments.find(t => t.id === c.tournament_id);
    const tName = tournament?.name || 'Unknown';
    if (!grouped[tName]) grouped[tName] = [];
    grouped[tName].push(c);
  });
  
  Object.entries(grouped).forEach(([tName, comps]) => {
    console.log(`\n${tName}:`);
    console.log(`  Total competitions: ${comps.length}`);
    comps.forEach(c => {
      const typeName = c.competition_types?.name || 'Unknown Type';
      console.log(`\n  ${typeName}:`);
      console.log(`    Status: ${c.status}`);
      console.log(`    Reg Opens: ${c.reg_open_at || 'NULL'}`);
      console.log(`    Reg Closes: ${c.reg_close_at || 'NULL'}`);
    });
  });
  
  // Check current time vs registration times
  console.log('\n' + '='.repeat(80));
  console.log('REGISTRATION STATUS CHECK (NOW):');
  console.log('='.repeat(80));
  const now = new Date();
  console.log(`Current time: ${now.toISOString()}\n`);
  
  Object.entries(grouped).forEach(([tName, comps]) => {
    console.log(`\n${tName}:`);
    let hasOpenReg = false;
    comps.forEach(c => {
      const typeName = c.competition_types?.name || 'Unknown Type';
      let status = '';
      
      if (!c.reg_close_at) {
        status = '❌ NO REG_CLOSE_AT';
      } else {
        const closeDate = new Date(c.reg_close_at);
        const openDate = c.reg_open_at ? new Date(c.reg_open_at) : null;
        
        if (now >= closeDate) {
          status = '🔴 CLOSED (past close time)';
        } else if (openDate && now < openDate) {
          status = '⏳ NOT OPEN YET';
        } else {
          status = '✅ OPEN';
          hasOpenReg = true;
        }
      }
      
      console.log(`  ${typeName}: ${status}`);
    });
    console.log(`  → Tournament visible: ${hasOpenReg ? 'YES' : 'NO (no open competitions)'}`);
  });
  
  process.exit(0);
})();
