require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== RUNNING AUTO-UPDATE FOR NORTHFORLAND OPEN ===\n');

  // Call the RPC functions
  console.log('1. Updating tournament statuses...');
  const { data: tournamentData, error: tournamentError } = await supabase
    .rpc('auto_update_tournament_statuses');

  if (tournamentError) {
    console.log('❌ Error:', tournamentError.message);
  } else {
    console.log('✅ Tournament update result:', JSON.stringify(tournamentData, null, 2));
  }

  console.log('\n2. Updating competition statuses...');
  const { data: competitionData, error: competitionError } = await supabase
    .rpc('auto_update_competition_statuses');

  if (competitionError) {
    console.log('❌ Error:', competitionError.message);
  } else {
    console.log('✅ Competition update result:', JSON.stringify(competitionData, null, 2));
  }

  // Verify the fix
  console.log('\n3. Verifying NORTHFORLAND OPEN status...');
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('name, status')
    .ilike('name', '%NORTHFORLAND%')
    .single();

  if (tournament) {
    console.log(`   ${tournament.name}: ${tournament.status}`);
    if (tournament.status === 'completed') {
      console.log('   ✅ Status corrected to "completed"!');
    } else {
      console.log(`   ⚠️  Status is still "${tournament.status}"`);
    }
  }

  console.log('\n=== UPDATE COMPLETE ===');
})();
