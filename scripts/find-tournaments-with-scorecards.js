const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllTournaments() {
  console.log('\n🔍 Finding all tournaments with scorecards...\n');
  
  // Get all tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .order('created_at', { ascending: false })
    .limit(20);
  
  for (const tournament of tournaments) {
    // Get competitions count
    const { data: competitions } = await supabase
      .from('competitions')
      .select('id')
      .eq('tournament_id', tournament.id);
    
    if (!competitions || competitions.length === 0) continue;
    
    // Count teams across all competitions
    let totalTeams = 0;
    for (const comp of competitions) {
      const { count } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', comp.id);
      totalTeams += count || 0;
    }
    
    if (totalTeams > 0) {
      console.log(`📋 ${tournament.name}`);
      console.log(`   ID: ${tournament.id}`);
      console.log(`   Competitions: ${competitions.length}`);
      console.log(`   Total Scorecards: ${totalTeams}\n`);
    }
  }
}

findAllTournaments();
