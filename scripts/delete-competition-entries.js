const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteCompetitionEntries() {
  const tournamentNames = [
    'Hero World Challenge',
    'Crown Australian Open',
    'Nedbank Golf Challenge in honour of Gary Player'
  ];
  
  console.log('\n🗑️  Deleting all competition entries for test tournaments...\n');
  
  let totalDeleted = 0;
  
  for (const name of tournamentNames) {
    console.log(`📋 ${name}`);
    
    // Get tournament
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, name')
      .ilike('name', `%${name}%`)
      .single();
    
    if (!tournament) {
      console.log(`  ⚠️  Tournament not found\n`);
      continue;
    }
    
    // Get all tournament_competitions for this tournament
    const { data: competitions } = await supabase
      .from('tournament_competitions')
      .select('id')
      .eq('tournament_id', tournament.id);
    
    if (!competitions || competitions.length === 0) {
      console.log(`  ℹ️  No competitions found\n`);
      continue;
    }
    
    const competitionIds = competitions.map(c => c.id);
    
    // Get all competition_entries for these competitions
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id')
      .in('competition_id', competitionIds);
    
    if (!entries || entries.length === 0) {
      console.log(`  ℹ️  No entries found\n`);
      continue;
    }
    
    const entryIds = entries.map(e => e.id);
    console.log(`  Found ${entries.length} entries`);
    
    // Delete entry_picks first (golfer selections)
    const { error: picksError } = await supabase
      .from('entry_picks')
      .delete()
      .in('entry_id', entryIds);
    
    if (picksError) {
      console.error(`  ❌ Error deleting entry_picks:`, picksError);
      continue;
    }
    console.log(`  ✅ Deleted entry_picks`);
    
    // Delete competition_entries
    const { error: entriesError } = await supabase
      .from('competition_entries')
      .delete()
      .in('id', entryIds);
    
    if (entriesError) {
      console.error(`  ❌ Error deleting entries:`, entriesError);
      continue;
    }
    console.log(`  ✅ Deleted ${entries.length} entries`);
    
    // Delete leaderboard entries for these competitions
    const { error: leaderboardError } = await supabase
      .from('competition_leaderboards')
      .delete()
      .in('competition_id', competitionIds);
    
    if (leaderboardError) {
      console.error(`  ⚠️  Error deleting leaderboard:`, leaderboardError.message);
    } else {
      console.log(`  ✅ Deleted leaderboard entries`);
    }
    
    totalDeleted += entries.length;
    console.log('');
  }
  
  console.log(`✅ All done! Deleted ${totalDeleted} total entries across all tournaments.\n`);
}

deleteCompetitionEntries();
