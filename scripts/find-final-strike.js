const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../apps/golf/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findFinalStrike() {
  // Get RSM Classic tournament ID
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name')
    .eq('slug', 'the-rsm-classic')
    .single();

  console.log('Tournament:', tournament);

  // Get all competitions for RSM Classic
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      entry_fee_pennies,
      competition_types (
        name,
        slug
      )
    `)
    .eq('tournament_id', tournament.id);

  console.log('\nAll RSM Classic competitions:');
  competitions.forEach(c => {
    console.log(`  - ${c.competition_types.name} (${c.competition_types.slug})`);
    console.log(`    ID: ${c.id}, Status: ${c.status}, Fee: ${c.entry_fee_pennies}p\n`);
  });
}

findFinalStrike().catch(console.error);
