const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournamentGolfers() {
  // Get tournament IDs
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')
    .in('name', ['Nedbank Golf Challenge in honour of Gary Player', 'Crown Australian Open']);

  console.log('Tournaments:');
  console.table(tournaments);

  for (const tournament of tournaments) {
    console.log(`\n=== ${tournament.name} ===`);
    
    const { data: golfers, count } = await supabase
      .from('tournament_golfers')
      .select('golfer_id, golfers(first_name, last_name, dg_id)', { count: 'exact' })
      .eq('tournament_id', tournament.id)
      .limit(5);

    console.log(`Total golfers: ${count}`);
    console.log('First 5 players:');
    if (golfers && golfers.length > 0) {
      golfers.forEach(g => {
        const golfer = g.golfers;
        console.log(`  - ${golfer.first_name} ${golfer.last_name} (DG ID: ${golfer.dg_id})`);
      });
    } else {
      console.log('  No golfers found');
    }
  }
}

checkTournamentGolfers();
