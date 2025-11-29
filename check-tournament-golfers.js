const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTournaments() {
  try {
    // Get last 10 tournaments
    const { data: tournaments, error: tourError } = await supabase
      .from('tournaments')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (tourError) throw tourError;

    console.log('\n=== Last 10 Tournaments ===');
    tournaments.forEach((t, i) => {
      const date = new Date(t.created_at).toLocaleDateString();
      console.log(`${i+1}. ${t.name} (Created: ${date})`);
      console.log(`   ID: ${t.id}`);
    });

    // Get golfer counts for these tournaments
    const tournamentIds = tournaments.map(t => t.id);
    const { data: golfers, error: golferError } = await supabase
      .from('tournament_golfers')
      .select('tournament_id')
      .in('tournament_id', tournamentIds);

    if (golferError) throw golferError;

    // Count golfers per tournament
    const counts = {};
    golfers.forEach(g => {
      counts[g.tournament_id] = (counts[g.tournament_id] || 0) + 1;
    });

    console.log('\n=== Golfer Counts ===');
    tournaments.forEach((t, i) => {
      const count = counts[t.id] || 0;
      const status = count === 0 ? '❌ EMPTY' : `✅ ${count} golfers`;
      console.log(`${i+1}. ${t.name}: ${status}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTournaments();
