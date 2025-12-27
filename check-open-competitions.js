require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOpenCompetitions() {
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      name,
      competitions:tournament_competitions(
        id,
        status,
        reg_open_at,
        reg_close_at,
        competition_types(name)
      )
    `)
    .in('name', ['Mister G\'s Open', 'THE THANET OPEN', 'THE GREENIDGE OPEN']);
  
  const now = new Date();
  console.log('Current time:', now.toISOString());
  console.log('\n=== OPEN COMPETITIONS BY TOURNAMENT ===\n');
  
  tournaments.forEach(t => {
    console.log(`${t.name}:`);
    const openComps = t.competitions.filter(c => {
      if (c.status === 'reg_open' && c.reg_close_at) {
        const closeDate = new Date(c.reg_close_at);
        return now < closeDate;
      }
      if (c.status === 'upcoming' && c.reg_open_at && c.reg_close_at) {
        const openDate = new Date(c.reg_open_at);
        const closeDate = new Date(c.reg_close_at);
        return now >= openDate && now < closeDate;
      }
      return false;
    });
    
    if (openComps.length === 0) {
      console.log('  ❌ NO OPEN COMPETITIONS');
    } else {
      openComps.forEach(c => {
        const isMain = ['Full Course', 'Beat The Cut', 'THE WEEKENDER'].includes(c.competition_types.name);
        console.log(`  ${isMain ? '✅ MAIN' : '⚠️  MINOR'}: ${c.competition_types.name} (${c.status}) - closes ${c.reg_close_at}`);
      });
    }
    console.log('');
  });
}

checkOpenCompetitions().catch(console.error);
