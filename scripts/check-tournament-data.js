const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTournaments() {
  console.log('\n🔍 Checking tournament data...\n');
  
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')
    .or('name.ilike.%Hero%,name.ilike.%Crown%,name.ilike.%Nedbank%');
  
  for (const tournament of tournaments) {
    console.log(`\n📋 ${tournament.name}`);
    console.log(`   ID: ${tournament.id.substring(0, 8)}...`);
    
    // Check competitions
    const { data: comps, count: compCount } = await supabase
      .from('competitions')
      .select('id, competition_type', { count: 'exact' })
      .eq('tournament_id', tournament.id);
    
    console.log(`   🏆 Competitions: ${compCount || 0}`);
    
    if (comps && comps.length > 0) {
      const compIds = comps.map(c => c.id);
      
      // Check teams
      const { count: teamCount } = await supabase
        .from('teams')
        .select('id', { count: 'exact', head: true })
        .in('competition_id', compIds);
      
      console.log(`   👥 Teams/Scorecards: ${teamCount || 0}`);
      
      // Check leaderboard
      const { count: leaderboardCount } = await supabase
        .from('leaderboards')
        .select('id', { count: 'exact', head: true })
        .in('competition_id', compIds);
      
      console.log(`   📊 Leaderboard entries: ${leaderboardCount || 0}`);
    }
  }
}

checkTournaments();
