const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupTournaments() {
  const tournamentNames = [
    'Hero World Challenge',
    'Crown Australian Open',
    'Nedbank Golf Challenge in honour of Gary Player'
  ];
  
  console.log('\n🧹 Cleaning up test data for tournaments...\n');
  
  for (const name of tournamentNames) {
    console.log(`\n📋 Processing: ${name}`);
    
    // Get tournament ID
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id')
      .ilike('name', `%${name}%`)
      .single();
    
    if (!tournament) {
      console.log(`  ⚠️  Tournament not found`);
      continue;
    }
    
    const tournamentId = tournament.id;
    console.log(`  ✅ Found tournament: ${tournamentId.substring(0, 8)}...`);
    
    // Get all competitions for this tournament
    const { data: competitions, error: compError } = await supabase
      .from('competitions')
      .select('id')
      .eq('tournament_id', tournamentId);
    
    if (compError) {
      console.error(`  ❌ Error fetching competitions:`, compError);
      continue;
    }
    
    if (!competitions || competitions.length === 0) {
      console.log(`  ℹ️  No competitions found`);
      continue;
    }
    
    console.log(`  📊 Found ${competitions.length} competitions`);
    
    const competitionIds = competitions.map(c => c.id);
    
    // Delete team_golfers (selections in scorecards)
    console.log(`  🗑️  Deleting team golfer selections...`);
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .in('competition_id', competitionIds);
    
    if (teams && teams.length > 0) {
      const teamIds = teams.map(t => t.id);
      
      const { error: teamGolfersError, count: teamGolfersCount } = await supabase
        .from('team_golfers')
        .delete()
        .in('team_id', teamIds);
      
      if (teamGolfersError) {
        console.error(`  ❌ Error deleting team_golfers:`, teamGolfersError);
      } else {
        console.log(`  ✅ Deleted team_golfers`);
      }
      
      // Delete teams (scorecards)
      console.log(`  🗑️  Deleting teams (scorecards)...`);
      const { error: teamsError } = await supabase
        .from('teams')
        .delete()
        .in('id', teamIds);
      
      if (teamsError) {
        console.error(`  ❌ Error deleting teams:`, teamsError);
      } else {
        console.log(`  ✅ Deleted ${teams.length} teams/scorecards`);
      }
    } else {
      console.log(`  ℹ️  No teams/scorecards found`);
    }
    
    // Delete leaderboard entries
    console.log(`  🗑️  Deleting leaderboard entries...`);
    const { error: leaderboardError } = await supabase
      .from('leaderboards')
      .delete()
      .in('competition_id', competitionIds);
    
    if (leaderboardError) {
      console.error(`  ❌ Error deleting leaderboard:`, leaderboardError);
    } else {
      console.log(`  ✅ Deleted leaderboard entries`);
    }
    
    console.log(`  ✅ Cleanup complete for ${name}`);
  }
  
  console.log('\n✅ All tournaments cleaned up! Ready for fresh testing.\n');
}

cleanupTournaments();
