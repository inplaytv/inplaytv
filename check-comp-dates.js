require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetitions() {
  const { data: comps } = await supabase
    .from('tournament_competitions')
    .select('id, entry_fee_pennies, status, reg_open_at, reg_close_at, start_at, tournament_id, competition_types(name)')
    .eq('tournament_id', '41408b41-82ee-4a83-9827-78c80be68fd4');
  
  console.log('The American Express Competitions:');
  comps.forEach(c => {
    console.log(`  ${c.competition_types?.name}: status=${c.status}, reg_close_at=${c.reg_close_at}`);
  });
}

checkCompetitions();
