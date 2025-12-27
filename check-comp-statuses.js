require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStatuses() {
  const { data } = await s
    .from('tournament_competitions')
    .select('id, status, reg_open_at, reg_close_at, start_at, competition_types(name), tournaments(name)')
    .order('tournaments(name)');

  console.log('COMPETITION STATUSES:\n');
  data?.forEach(c => {
    const tournament = c.tournaments?.name || 'Unknown';
    const comp = (c.competition_types?.name || 'Unknown').padEnd(20);
    const status = (c.status || 'null').padEnd(12);
    const regOpen = c.reg_open_at?.substring(0, 16) || 'null';
    const start = c.start_at?.substring(0, 16) || 'null';
    
    console.log(`${tournament.padEnd(25)} | ${comp} | ${status} | reg_open: ${regOpen} | start: ${start}`);
  });
  
  console.log('\n\nSTATUS SUMMARY:');
  const statusCounts = {};
  data?.forEach(c => {
    const s = c.status || 'null';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
}

checkStatuses();
