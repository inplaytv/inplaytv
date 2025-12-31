require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatest() {
  console.log('=== CHECKING LATEST TOURNAMENT ===\n');

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Tournament: ${tournament.name}`);
  console.log(`ID: ${tournament.id}`);
  console.log(`Created: ${new Date(tournament.created_at).toLocaleString()}`);
  console.log(`Status: ${tournament.status}`);
  console.log(`is_visible: ${tournament.is_visible}`);
  console.log(`slug: ${tournament.slug}\n`);

  // Check competitions
  const { data: competitions, error: compError } = await supabase
    .from('tournament_competitions')
    .select('*, competition_types(name)')
    .eq('tournament_id', tournament.id);

  if (compError) {
    console.error('❌ Competition Error:', compError.message);
    return;
  }

  console.log(`\n📊 COMPETITIONS: ${competitions.length} found\n`);
  
  if (competitions.length === 0) {
    console.log('❌ NO COMPETITIONS CREATED!\n');
  } else {
    competitions.forEach(c => {
      console.log(`  - ${c.competition_types?.name || 'Unknown'}`);
      console.log(`    Format: ${c.competition_format || 'NULL'}`);
      console.log(`    Type ID: ${c.competition_type_id || 'NULL'}`);
      console.log(`    Status: ${c.status}`);
    });
  }
}

checkLatest()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
