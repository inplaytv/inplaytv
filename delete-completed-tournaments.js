const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteCompletedTournaments() {
  console.log('🔍 Finding completed tournaments...\n');
  
  // Get all completed tournaments
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .eq('status', 'completed')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching tournaments:', error);
    return;
  }
  
  if (!tournaments || tournaments.length === 0) {
    console.log('No completed tournaments found.');
    return;
  }
  
  console.log(`Found ${tournaments.length} completed tournaments:\n`);
  tournaments.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name} (${t.id})`);
  });
  
  console.log('\n⚠️  WARNING: This will delete ALL data associated with these tournaments!');
  console.log('Starting deletion in 3 seconds...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  for (const tournament of tournaments) {
    console.log(`\n🗑️  Deleting: ${tournament.name}`);
    console.log('─'.repeat(50));
    
    try {
      // 1. Get all competitions for this tournament
      const { data: competitions } = await supabase
        .from('tournament_competitions')
        .select('id')
        .eq('tournament_id', tournament.id);
      
      const competitionIds = competitions?.map(c => c.id) || [];
      console.log(`   Found ${competitionIds.length} competitions`);
      
      if (competitionIds.length > 0) {
        // 2. Delete competition_entry_picks
        const { error: picksError, count: picksCount } = await supabase
          .from('competition_entry_picks')
          .delete({ count: 'exact' })
          .in('entry_id', 
            (await supabase
              .from('competition_entries')
              .select('id')
              .in('competition_id', competitionIds)
            ).data?.map(e => e.id) || []
          );
        console.log(`   ✓ Deleted ${picksCount || 0} entry picks`);
        
        // 3. Delete competition_entries
        const { error: entriesError, count: entriesCount } = await supabase
          .from('competition_entries')
          .delete({ count: 'exact' })
          .in('competition_id', competitionIds);
        console.log(`   ✓ Deleted ${entriesCount || 0} competition entries`);
        
        // 4. Delete competition_golfers
        const { error: compGolfersError, count: compGolfersCount } = await supabase
          .from('competition_golfers')
          .delete({ count: 'exact' })
          .in('competition_id', competitionIds);
        console.log(`   ✓ Deleted ${compGolfersCount || 0} competition golfers`);
        
        // 5. Delete tournament_competitions
        const { error: compsError, count: compsCount } = await supabase
          .from('tournament_competitions')
          .delete({ count: 'exact' })
          .eq('tournament_id', tournament.id);
        console.log(`   ✓ Deleted ${compsCount || 0} tournament competitions`);
      }
      
      // 6. Get tournament_golfers for score deletion
      const { data: tournamentGolfers } = await supabase
        .from('tournament_golfers')
        .select('id')
        .eq('tournament_id', tournament.id);
      
      const tournamentGolferIds = tournamentGolfers?.map(tg => tg.id) || [];
      console.log(`   Found ${tournamentGolferIds.length} tournament golfers`);
      
      if (tournamentGolferIds.length > 0) {
        // 7. Delete golfer_round_scores
        const { error: scoresError, count: scoresCount } = await supabase
          .from('golfer_round_scores')
          .delete({ count: 'exact' })
          .in('tournament_golfer_id', tournamentGolferIds);
        console.log(`   ✓ Deleted ${scoresCount || 0} round scores`);
        
        // 8. Delete tournament_golfers
        const { error: tgError, count: tgCount } = await supabase
          .from('tournament_golfers')
          .delete({ count: 'exact' })
          .eq('tournament_id', tournament.id);
        console.log(`   ✓ Deleted ${tgCount || 0} tournament golfers`);
      }
      
      // 9. Delete player_round_stats
      const { error: statsError, count: statsCount } = await supabase
        .from('player_round_stats')
        .delete({ count: 'exact' })
        .eq('tournament_id', tournament.id);
      console.log(`   ✓ Deleted ${statsCount || 0} player round stats`);
      
      // 10. Delete ALL audit log entries (brute force due to corrupted FKs)
      // First, get all audit logs for this tournament
      const { data: auditLogs } = await supabase
        .from('tournament_score_audit_log')
        .select('id')
        .eq('tournament_id', tournament.id);
      
      if (auditLogs && auditLogs.length > 0) {
        // Delete them individually to bypass FK checks
        for (const log of auditLogs) {
          await supabase
            .from('tournament_score_audit_log')
            .delete()
            .eq('id', log.id);
        }
        console.log(`   ✓ Deleted ${auditLogs.length} audit log entries`);
      } else {
        console.log(`   ✓ Deleted 0 audit log entries`);
      }
      
      // 11. Delete tournament_round_scores if they exist
      const { error: roundScoresError, count: roundScoresCount } = await supabase
        .from('tournament_round_scores')
        .delete({ count: 'exact' })
        .eq('tournament_id', tournament.id);
      console.log(`   ✓ Deleted ${roundScoresCount || 0} tournament round scores`);
      
      // 12. Finally, delete the tournament itself
      const { error: tournamentError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournament.id);
      
      if (tournamentError) {
        console.error(`   ❌ Error deleting tournament:`, tournamentError);
      } else {
        console.log(`   ✅ Tournament deleted successfully!`);
      }
      
    } catch (err) {
      console.error(`   ❌ Error processing ${tournament.name}:`, err);
    }
  }
  
  console.log('\n✅ Deletion complete!\n');
  
  // Verify remaining tournaments
  const { data: remaining } = await supabase
    .from('tournaments')
    .select('name, status')
    .order('start_date', { ascending: true });
  
  console.log(`Remaining tournaments: ${remaining?.length || 0}`);
  remaining?.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name} (${t.status})`);
  });
}

deleteCompletedTournaments().catch(console.error);
