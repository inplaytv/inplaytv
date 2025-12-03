const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n🔍 Checking database for scorecards data...\n');
  
  // Check teams table
  const { data: teamsCount, error: teamsError } = await supabase
    .from('teams')
    .select('*', { count: 'exact', head: true });
  
  console.log('Teams table:', teamsError ? `Error: ${teamsError.message}` : `${teamsCount} rows`);
  
  // Try getting actual teams
  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_name, user_id, competition_id')
    .limit(5);
  
  if (teams && teams.length > 0) {
    console.log('\nSample teams:');
    teams.forEach(t => console.log(`  - ${t.team_name} (comp: ${t.competition_id?.substring(0,8)})`));
  }
  
  // Check competitions
  const { data: comps } = await supabase
    .from('competitions')
    .select('id, competition_type, tournament_id')
    .limit(5);
  
  console.log('\nCompetitions found:', comps?.length || 0);
  
  // Check tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')
    .or('name.ilike.%Hero%,name.ilike.%Crown%,name.ilike.%Nedbank%');
  
  console.log('\nTarget tournaments:');
  if (tournaments) {
    for (const t of tournaments) {
      console.log(`\n  📋 ${t.name}`);
      console.log(`     ID: ${t.id}`);
      
      // Get competitions for this tournament
      const { data: tournamentComps } = await supabase
        .from('competitions')
        .select('id')
        .eq('tournament_id', t.id);
      
      console.log(`     Competitions: ${tournamentComps?.length || 0}`);
      
      if (tournamentComps && tournamentComps.length > 0) {
        // Count teams
        let totalTeams = 0;
        for (const comp of tournamentComps) {
          const { count } = await supabase
            .from('teams')
            .select('*', { count: 'exact', head: true })
            .eq('competition_id', comp.id);
          totalTeams += count || 0;
        }
        console.log(`     Scorecards: ${totalTeams}`);
      }
    }
  }
}

checkDatabase();
