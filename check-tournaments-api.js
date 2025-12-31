require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTournaments() {
  console.log('=== CHECKING TOURNAMENTS API ===\n');

  // Check all tournaments
  const { data: all, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_competitions!tournament_competitions_tournament_id_fkey(
        id,
        competition_type_id,
        competition_format,
        status
      )
    `)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total tournaments: ${all.length}\n`);

  all.forEach(t => {
    console.log(`Tournament: ${t.name}`);
    console.log(`  ID: ${t.id}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  is_visible: ${t.is_visible}`);
    console.log(`  Competitions: ${t.tournament_competitions.length}`);
    t.tournament_competitions.forEach(c => {
      console.log(`    - Format: ${c.competition_format}, Status: ${c.status}`);
    });
    console.log();
  });

  // Check what golf app would see
  console.log('=== WHAT GOLF APP SEES (active tournaments) ===\n');
  
  const { data: active } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_competitions(*)
    `)
    .in('status', ['upcoming', 'reg_open', 'live'])
    .order('start_date', { ascending: true });

  console.log(`Active tournaments: ${active?.length || 0}`);
  if (active && active.length > 0) {
    active.forEach(t => {
      console.log(`  - ${t.name} (${t.status})`);
    });
  }
}

checkTournaments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
