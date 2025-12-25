require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatus() {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('name', 'THE THANET OPEN')
    .single();

  console.log('Tournament:', tournament);

  const { data: comps } = await supabase
    .from('tournament_competitions')
    .select('id, competition_types(name), reg_open_at, reg_close_at, start_at, end_at, status')
    .eq('tournament_id', tournament.id);

  console.log('\nCompetitions:');
  
  comps.forEach(c => {
    console.log(`\n${c.competition_types.name}:`);
    console.log(`  Status: ${c.status}`);
    console.log(`  Reg Open: ${c.reg_open_at}`);
    console.log(`  Reg Close: ${c.reg_close_at}`);
    console.log(`  Start: ${c.start_at}`);
    console.log(`  End: ${c.end_at}`);
    
    const now = new Date();
    const regClose = c.reg_close_at ? new Date(c.reg_close_at) : null;
    const start = c.start_at ? new Date(c.start_at) : null;
    
    console.log(`\n  NOW: ${now.toISOString()}`);
    console.log(`  Reg Close Date: ${regClose ? regClose.toISOString() : 'N/A'}`);
    console.log(`  Start Date: ${start ? start.toISOString() : 'N/A'}`);
    console.log(`  Is past reg close? ${regClose ? now > regClose : 'N/A'}`);
    console.log(`  Is past start? ${start ? now > start : 'N/A'}`);
  });
}

checkStatus();
