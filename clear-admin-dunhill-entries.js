const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAdminDunhillEntries() {
  try {
    console.log('🔍 Finding Alfred Dunhill Championship...');
    
    // Find tournament
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id, name')
      .ilike('name', '%Alfred Dunhill%')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!tournaments || tournaments.length === 0) {
      console.log('❌ Tournament not found');
      return;
    }
    
    const tournament = tournaments[0];
    console.log(`✓ Found: ${tournament.name}`);
    console.log(`  ID: ${tournament.id}`);
    
    // Find admin user
    const { data: admins } = await supabase
      .from('admins')
      .select('user_id')
      .limit(1);
    
    if (!admins || admins.length === 0) {
      console.log('❌ No admin user found');
      return;
    }
    
    const adminUserId = admins[0].user_id;
    console.log(`✓ Admin User ID: ${adminUserId}`);
    
    // Find all competitions for this tournament
    const { data: competitions } = await supabase
      .from('competitions')
      .select('id, name')
      .eq('tournament_id', tournament.id);
    
    console.log(`\n📋 Found ${competitions?.length || 0} competitions:`);
    competitions?.forEach(c => console.log(`  - ${c.name}`));
    
    // Find admin entries
    const { data: entries } = await supabase
      .from('competition_entries')
      .select(`
        id,
        competition_id,
        created_at,
        competitions (
          name
        )
      `)
      .eq('user_id', adminUserId)
      .in('competition_id', competitions?.map(c => c.id) || []);
    
    console.log(`\n🎯 Found ${entries?.length || 0} admin entries to delete:`);
    entries?.forEach(e => {
      console.log(`  - ${e.competitions?.name} (${new Date(e.created_at).toLocaleString()})`);
    });
    
    if (!entries || entries.length === 0) {
      console.log('\n✅ No entries to delete - you\'re already clean!');
      return;
    }
    
    // Confirm deletion
    console.log(`\n⚠️  About to delete ${entries.length} entries...`);
    console.log('Press Ctrl+C to cancel, or wait 3 seconds...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Delete entries
    const { error } = await supabase
      .from('competition_entries')
      .delete()
      .eq('user_id', adminUserId)
      .in('competition_id', competitions?.map(c => c.id) || []);
    
    if (error) {
      console.error('❌ Error deleting entries:', error);
      return;
    }
    
    console.log(`\n✅ Successfully deleted ${entries.length} admin entries!`);
    console.log('   You can now make fresh selections for the tournament.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearAdminDunhillEntries();
