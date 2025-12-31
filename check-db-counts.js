require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCounts() {
  console.log('=== DATABASE COUNTS ===\n');

  const tables = [
    'tournaments',
    'tournament_competitions',
    'competition_entries',
    'entry_picks',
    'tournament_golfers',
    'competition_golfers'
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    } else {
      console.log(`${table}: ${count}`);
    }
  }

  // Check latest tournament details
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tournament) {
    console.log(`\n=== LATEST TOURNAMENT ===`);
    console.log(`Name: ${tournament.name}`);
    console.log(`ID: ${tournament.id}`);
    console.log(`Created: ${new Date(tournament.created_at).toLocaleString()}`);

    // Check competitions for this tournament
    const { data: competitions } = await supabase
      .from('tournament_competitions')
      .select('id, competition_format, competition_type_id')
      .eq('tournament_id', tournament.id);

    console.log(`\nCompetitions: ${competitions?.length || 0}`);
    if (competitions && competitions.length > 0) {
      competitions.forEach(c => {
        console.log(`  - Format: ${c.competition_format}, Type ID: ${c.competition_type_id}`);
      });
    }
  }
}

checkCounts()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
