const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdminEntries() {
  try {
    // Get admin users
    const { data: admins } = await supabase.from('admins').select('user_id');
    console.log('Admin user IDs:', admins?.map(a => a.user_id));
    
    if (!admins || admins.length === 0) {
      console.log('No admin users found');
      return;
    }
    
    // Check entries for each admin
    for (const admin of admins) {
      const adminId = admin.user_id;
      console.log('\n=== Checking entries for admin:', adminId);
      
      const { data: entries } = await supabase
        .from('competition_entries')
        .select(`
          id,
          user_id,
          competition_id,
          golfer_ids,
          competitions (
            id,
            name,
            tournament_id,
            tournaments (
              id,
              name
            )
          )
        `)
        .eq('user_id', adminId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      console.log(`Found ${entries?.length || 0} entries`);
      
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          const tournamentId = entry.competitions?.tournaments?.id;
          const tournamentName = entry.competitions?.tournaments?.name;
          const competitionName = entry.competitions?.name;
          
          console.log(`\n--- Entry for ${competitionName} in ${tournamentName}`);
          
          // Get tournament golfers
          const { data: tournamentGolfers } = await supabase
            .from('tournament_golfers')
            .select('golfer_id, golfers(id, name)')
            .eq('tournament_id', tournamentId)
            .eq('is_withdrawn', false);
          
          const adminGolferIds = entry.golfer_ids || [];
          const tournamentGolferIds = tournamentGolfers?.map(tg => tg.golfer_id) || [];
          
          console.log(`  Admin selected: ${adminGolferIds.length} golfers`);
          console.log(`  Tournament has: ${tournamentGolferIds.length} valid golfers`);
          
          const invalidGolfers = adminGolferIds.filter(id => !tournamentGolferIds.includes(id));
          
          if (invalidGolfers.length > 0) {
            console.log(`  ⚠️  PROBLEM: ${invalidGolfers.length} invalid golfers`);
            
            // Get names
            const { data: golfers } = await supabase
              .from('golfers')
              .select('id, name')
              .in('id', invalidGolfers);
            
            console.log('  Invalid golfers:');
            golfers?.forEach(g => console.log(`    - ${g.name} (${g.id})`));
          } else {
            console.log('  ✓ All golfers valid');
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminEntries();
