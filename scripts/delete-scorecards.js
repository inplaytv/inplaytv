const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteScorecards() {
  const tournamentNames = [
    'Hero World Challenge',
    'Crown Australian Open', 
    'Nedbank Golf Challenge in honour of Gary Player'
  ];
  
  console.log('\n🗑️  Deleting all scorecards and leaderboard entries...\n');
  
  for (const name of tournamentNames) {
    console.log(`📋 ${name}`);
    
    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id')
      .ilike('name', `%${name}%`)
      .single();
    
    if (!tournament) {
      console.log(`  ⚠️  Not found\n`);
      continue;
    }
    
    // Get competitions with teams count
    const { data: competitions } = await supabase
      .from('competitions')
      .select(`
        id,
        competition_type,
        teams (count)
      `)
      .eq('tournament_id', tournament.id);
    
    if (!competitions || competitions.length === 0) {
      console.log(`  ℹ️  No competitions\n`);
      continue;
    }
    
    let totalDeleted = 0;
    
    for (const comp of competitions) {
      const teamCount = comp.teams?.[0]?.count || 0;
      
      if (teamCount > 0) {
        // Delete team_golfers first
        const { data: teams } = await supabase
          .from('teams')
          .select('id')
          .eq('competition_id', comp.id);
        
        if (teams && teams.length > 0) {
          const teamIds = teams.map(t => t.id);
          
          await supabase
            .from('team_golfers')
            .delete()
            .in('team_id', teamIds);
          
          // Delete teams
          await supabase
            .from('teams')
            .delete()
            .in('id', teamIds);
          
          totalDeleted += teams.length;
        }
      }
      
      // Delete leaderboard entries
      await supabase
        .from('leaderboards')
        .delete()
        .eq('competition_id', comp.id);
    }
    
    console.log(`  ✅ Deleted ${totalDeleted} scorecards\n`);
  }
  
  console.log('✅ All done! Scorecards and leaderboards cleared.\n');
}

deleteScorecards();
