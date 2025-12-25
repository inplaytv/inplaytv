require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseGolferIssue() {
  console.log('\n🔍 DIAGNOSING GOLFER VISIBILITY ISSUE\n');
  
  // Get tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(5);
  
  for (const tournament of tournaments) {
    console.log(`\n📍 Tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);
    
    // Get golfers in tournament
    const { data: tournamentGolfers } = await supabase
      .from('tournament_golfers')
      .select('golfer_id')
      .eq('tournament_id', tournament.id);
    
    console.log(`   ✅ ${tournamentGolfers?.length || 0} golfers in tournament_golfers`);
    
    // Get competitions
    const { data: competitions } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        assigned_golfer_group_id,
        competition_types(name)
      `)
      .eq('tournament_id', tournament.id);
    
    if (!competitions || competitions.length === 0) {
      console.log(`   ⚠️  No competitions found`);
      continue;
    }
    
    for (const comp of competitions) {
      console.log(`\n   🏆 Competition: ${comp.competition_types?.name}`);
      console.log(`      Competition ID: ${comp.id}`);
      console.log(`      Assigned Golfer Group: ${comp.assigned_golfer_group_id || 'NONE'}`);
      
      if (comp.assigned_golfer_group_id) {
        // Check if group exists
        const { data: group } = await supabase
          .from('golfer_groups')
          .select('id, name')
          .eq('id', comp.assigned_golfer_group_id)
          .single();
        
        if (group) {
          console.log(`      Group Name: ${group.name}`);
          
          // Check golfers in group
          const { data: groupMembers } = await supabase
            .from('golfer_group_members')
            .select('golfer_id')
            .eq('group_id', comp.assigned_golfer_group_id);
          
          console.log(`      ✅ ${groupMembers?.length || 0} golfers in golfer_group_members`);
          
          // Check overlap
          if (tournamentGolfers && groupMembers) {
            const tournamentGolferIds = new Set(tournamentGolfers.map(g => g.golfer_id));
            const groupGolferIds = new Set(groupMembers.map(g => g.golfer_id));
            
            const overlap = [...tournamentGolferIds].filter(id => groupGolferIds.has(id));
            console.log(`      🎯 ${overlap.length} golfers in BOTH tournament AND group`);
            
            if (overlap.length === 0) {
              console.log(`      ❌ PROBLEM: No golfers in both tournament and group!`);
              console.log(`         This is why no golfers show in team builder!`);
              console.log(`\n      💡 SOLUTION:`);
              console.log(`         Option 1: Remove golfer group assignment (set to NULL)`);
              console.log(`         Option 2: Add tournament golfers to the group`);
            }
          }
        } else {
          console.log(`      ❌ ERROR: Golfer group not found!`);
        }
      } else {
        console.log(`      ✅ No group filter - all tournament golfers visible`);
      }
    }
  }
}

diagnoseGolferIssue().then(() => process.exit(0));
