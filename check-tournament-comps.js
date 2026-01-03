require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompetitions() {
  console.log('Checking competitions for tournaments...\n');
  
  // Get tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status')
    .in('slug', ['the-greenidge-open', 'westgate-birchington-golf-club']);
  
  if (!tournaments) {
    console.log('No tournaments found');
    return;
  }
  
  for (const tournament of tournaments) {
    console.log(`\n=== ${tournament.name} (${tournament.slug}) ===`);
    console.log(`Tournament Status: ${tournament.status}`);
    
    // Get competitions
    const { data: comps, count } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        status,
        entry_fee_pennies,
        reg_open_at,
        reg_close_at,
        competition_type_id,
        competition_types (
          name,
          slug
        )
      `, { count: 'exact' })
      .eq('tournament_id', tournament.id);
    
    console.log(`Total competitions: ${count}`);
    
    if (comps && comps.length > 0) {
      comps.forEach((c, i) => {
        console.log(`\n  Competition ${i + 1}:`);
        console.log(`    Type: ${c.competition_types?.name || 'Unknown'}`);
        console.log(`    Status: ${c.status}`);
        console.log(`    Entry Fee: £${(c.entry_fee_pennies / 100).toFixed(2)}`);
        console.log(`    Reg Open: ${c.reg_open_at || 'Not set'}`);
        console.log(`    Reg Close: ${c.reg_close_at || 'Not set'}`);
      });
    } else {
      console.log('  ❌ NO COMPETITIONS FOUND');
    }
  }
}

checkCompetitions().then(() => process.exit(0));
