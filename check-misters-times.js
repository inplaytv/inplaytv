require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMistersTimes() {
  // Get tournament dates
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, start_date, end_date, status')
    .eq('name', "Mister G's Open")
    .single();
  
  console.log('=== TOURNAMENT ===');
  console.log('Name:', tournament.name);
  console.log('Start Date:', tournament.start_date);
  console.log('End Date:', tournament.end_date);
  console.log('Status:', tournament.status);
  console.log('');
  
  // Get competition times
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select('competition_types(name), status, reg_open_at, reg_close_at, start_at, end_at')
    .eq('tournament_id', tournament.id);
  
  console.log('=== COMPETITIONS ===');
  const now = new Date();
  console.log('Current time:', now.toISOString());
  console.log('');
  
  competitions.forEach(c => {
    const regClose = new Date(c.reg_close_at);
    const isClosed = now >= regClose;
    
    console.log(`${c.competition_types.name}:`);
    console.log('  Status:', c.status);
    console.log('  Reg Close:', c.reg_close_at, isClosed ? '❌ CLOSED' : '✅ OPEN');
    console.log('  Start:', c.start_at);
    console.log('  End:', c.end_at);
    console.log('');
  });
}

checkMistersTimes().catch(console.error);
