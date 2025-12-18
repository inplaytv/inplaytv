require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTournaments() {
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      name,
      slug,
      status,
      start_date,
      end_date,
      tournament_competitions!tournament_competitions_tournament_id_fkey (
        id,
        status,
        reg_close_at
      )
    `)
    .order('start_date', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Recent tournaments:');
  tournaments.forEach(t => {
    console.log(`\n${t.name}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  End date: ${t.end_date}`);
    console.log(`  Competitions: ${t.tournament_competitions?.length || 0}`);
    if (t.tournament_competitions?.length > 0) {
      t.tournament_competitions.forEach(c => {
        console.log(`    - Status: ${c.status}, Reg close: ${c.reg_close_at}`);
      });
    }
  });
}

checkTournaments();
