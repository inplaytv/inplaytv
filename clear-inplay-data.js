require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearInPlayData() {
  console.log('🗑️  CLEARING INPLAY PLATFORM DATA ONLY\n');
  console.log('⚠️  This will DELETE:');
  console.log('   - All tournaments');
  console.log('   - All tournament_competitions');
  console.log('   - All tournament_golfers');
  console.log('   - All competition_entries with competition_id (InPlay entries)');
  console.log('   - All related competition_entry_picks\n');
  console.log('✅ This will NOT touch:');
  console.log('   - Clubhouse (clubhouse_* tables)');
  console.log('   - ONE 2 ONE (competition_instances, entries with instance_id)');
  console.log('   - Golfers master table');
  console.log('   - User accounts or wallets\n');

  try {
    // Step 1: Get all InPlay entry IDs (those with competition_id set)
    console.log('Step 1: Finding InPlay entries...');
    const { data: inplayEntries, error: findError } = await supabase
      .from('competition_entries')
      .select('id')
      .not('competition_id', 'is', null); // InPlay entries have competition_id
    
    if (findError) {
      console.error('❌ Error finding entries:', findError);
      throw findError;
    }
    
    const inplayEntryIds = inplayEntries?.map(e => e.id) || [];
    console.log(`   Found ${inplayEntryIds.length} InPlay entries`);

    // Step 2: Delete competition_entry_picks for InPlay entries only
    if (inplayEntryIds.length > 0) {
      console.log('\nStep 2: Deleting competition entry picks (InPlay only)...');
      const { error: picksError } = await supabase
        .from('competition_entry_picks')
        .delete()
        .in('entry_id', inplayEntryIds);
      
      if (picksError) {
        console.error('❌ Error deleting picks:', picksError);
        throw picksError;
      }
      console.log('   ✅ Deleted InPlay entry picks');
    } else {
      console.log('\nStep 2: No entry picks to delete');
    }

    // Step 3: Delete InPlay competition entries
    if (inplayEntryIds.length > 0) {
      console.log('\nStep 3: Deleting InPlay competition entries...');
      const { error: entriesError } = await supabase
        .from('competition_entries')
        .delete()
        .not('competition_id', 'is', null); // Only delete InPlay entries
      
      if (entriesError) {
        console.error('❌ Error deleting entries:', entriesError);
        throw entriesError;
      }
      console.log('   ✅ Deleted InPlay entries');
    } else {
      console.log('\nStep 3: No competition entries to delete');
    }

    // Step 4: Delete tournament_competitions
    console.log('\nStep 4: Deleting tournament competitions...');
    const { error: compsError } = await supabase
      .from('tournament_competitions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (compsError) {
      console.error('❌ Error deleting competitions:', compsError);
      throw compsError;
    }
    console.log('   ✅ Deleted tournament competitions');

    // Step 5: Delete tournament_golfers
    console.log('\nStep 5: Deleting tournament golfers...');
    const { error: tgError } = await supabase
      .from('tournament_golfers')
      .delete()
      .neq('tournament_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (tgError) {
      console.error('❌ Error deleting tournament golfers:', tgError);
      throw tgError;
    }
    console.log('   ✅ Deleted tournament golfers');

    // Step 6: Delete tournaments
    console.log('\nStep 6: Deleting tournaments...');
    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (tournamentsError) {
      console.error('❌ Error deleting tournaments:', tournamentsError);
      throw tournamentsError;
    }
    console.log('   ✅ Deleted tournaments');

    // Verification
    console.log('\n📊 Verification:');
    const { data: remainingEntries } = await supabase
      .from('competition_entries')
      .select('id, competition_id, instance_id');
    
    const { data: remainingTournaments } = await supabase
      .from('tournaments')
      .select('id');
    
    const { data: remainingComps } = await supabase
      .from('tournament_competitions')
      .select('id');

    console.log(`   Remaining InPlay entries: ${remainingEntries?.filter(e => e.competition_id).length || 0}`);
    console.log(`   Remaining ONE 2 ONE entries: ${remainingEntries?.filter(e => e.instance_id).length || 0} (preserved ✅)`);
    console.log(`   Remaining tournaments: ${remainingTournaments?.length || 0}`);
    console.log(`   Remaining tournament_competitions: ${remainingComps?.length || 0}`);

    console.log('\n✨ InPlay platform cleared successfully!');
    console.log('🔒 Clubhouse and ONE 2 ONE data remain intact.');

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

clearInPlayData().then(() => process.exit(0));
