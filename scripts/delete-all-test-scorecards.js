const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllScorecards() {
  console.log('\n🗑️  Finding and deleting ALL scorecards for Hero, Crown, and Nedbank...\n');
  
  // Get ALL teams with tournament info
  const { data: teams } = await supabase
    .from('teams')
    .select(`
      id,
      team_name,
      competition_id,
      competitions (
        id,
        competition_type,
        tournaments (
          id,
          name
        )
      )
    `);
  
  if (!teams || teams.length === 0) {
    console.log('No teams found in database\n');
    return;
  }
  
  const targetTournaments = ['Hero', 'Crown', 'Nedbank'];
  const teamsToDelete = teams.filter(team => {
    const tournamentName = team.competitions?.tournaments?.name || '';
    return targetTournaments.some(keyword => tournamentName.includes(keyword));
  });
  
  if (teamsToDelete.length === 0) {
    console.log('No teams found for Hero, Crown, or Nedbank tournaments\n');
    return;
  }
  
  console.log(`Found ${teamsToDelete.length} scorecards to delete:\n`);
  
  for (const team of teamsToDelete) {
    console.log(`  - ${team.team_name} (${team.competitions?.tournaments?.name})`);
  }
  
  console.log('\n🗑️  Deleting...\n');
  
  const teamIds = teamsToDelete.map(t => t.id);
  
  // Delete team_golfers first (player selections)
  const { error: teamGolfersError } = await supabase
    .from('team_golfers')
    .delete()
    .in('team_id', teamIds);
  
  if (teamGolfersError) {
    console.error('❌ Error deleting team_golfers:', teamGolfersError);
  } else {
    console.log('✅ Deleted team_golfers (player selections)');
  }
  
  // Delete teams (scorecards)
  const { error: teamsError } = await supabase
    .from('teams')
    .delete()
    .in('id', teamIds);
  
  if (teamsError) {
    console.error('❌ Error deleting teams:', teamsError);
  } else {
    console.log(`✅ Deleted ${teamsToDelete.length} scorecards`);
  }
  
  // Delete leaderboard entries for these competitions
  const compIds = [...new Set(teamsToDelete.map(t => t.competition_id))];
  const { error: leaderboardError } = await supabase
    .from('leaderboards')
    .delete()
    .in('competition_id', compIds);
  
  if (leaderboardError) {
    console.error('❌ Error deleting leaderboard:', leaderboardError);
  } else {
    console.log('✅ Deleted leaderboard entries');
  }
  
  console.log('\n✅ All done! Scorecards cleared for testing.\n');
}

deleteAllScorecards();
