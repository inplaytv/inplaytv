require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearInPlayData() {
  console.log('🗑️  Clearing InPlay Platform Data ONLY...\n');
  console.log('⚠️  This will DELETE:');
  console.log('   - All InPlay tournaments');
  console.log('   - All InPlay competitions (competition_format = "inplay")');
  console.log('   - All InPlay entries');
  console.log('   - All InPlay entry picks');
  console.log('   - All tournament golfers\n');
  console.log('✅ This will PRESERVE:');
  console.log('   - Clubhouse events & competitions');
  console.log('   - ONE 2 ONE challenges (competition_format = "one2one")');
  console.log('   - Clubhouse entries');
  console.log('   - All golfers data\n');

  try {
    // 1. Get InPlay competition IDs first
    console.log('Step 1: Finding InPlay competitions...');
    const { data: inplayComps } = await supabase
      .from('tournament_competitions')
      .select('id')
      .eq('competition_format', 'inplay');
    
    const inplayCompIds = inplayComps ? inplayComps.map(c => c.id) : [];
    console.log(`   Found ${inplayCompIds.length} InPlay competitions`);

    if (inplayCompIds.length > 0) {
      // 2. Get InPlay entries
      console.log('\nStep 2: Finding InPlay competition entries...');
      const { data: inplayEntries } = await supabase
        .from('competition_entries')
        .select('id')
        .in('competition_id', inplayCompIds);
      
      const entryIds = inplayEntries ? inplayEntries.map(e => e.id) : [];
      console.log(`   Found ${entryIds.length} InPlay entries`);

      if (entryIds.length > 0) {
        // 3. Delete entry picks
        console.log('\nStep 3: Deleting InPlay entry picks...');
        const { error: picksError } = await supabase
          .from('competition_entry_picks')
          .delete()
          .in('entry_id', entryIds);
        
        if (picksError) {
          console.error('❌ Error deleting picks:', picksError);
        } else {
          console.log(`✅ Deleted picks for ${entryIds.length} entries`);
        }

        // 4. Delete InPlay entries
        console.log('\nStep 4: Deleting InPlay competition entries...');
        const { error: entriesError } = await supabase
          .from('competition_entries')
          .delete()
          .in('competition_id', inplayCompIds);
        
        if (entriesError) {
          console.error('❌ Error deleting entries:', entriesError);
        } else {
          console.log('✅ Deleted all InPlay competition entries');
        }
      }
    }

    // 5. Delete InPlay competitions
    console.log('\nStep 5: Deleting InPlay tournament competitions...');
    const { error: compsError } = await supabase
      .from('tournament_competitions')
      .delete()
      .eq('competition_format', 'inplay');
    
    if (compsError) {
      console.error('❌ Error deleting competitions:', compsError);
    } else {
      console.log('✅ Deleted all InPlay tournament competitions');
    }

    // 6. Delete tournament golfers
    console.log('\nStep 6: Deleting tournament golfers...');
    const { error: tgError } = await supabase
      .from('tournament_golfers')
      .delete()
      .neq('tournament_id', '00000000-0000-0000-0000-000000000000');
    
    if (tgError) {
      console.error('❌ Error deleting tournament golfers:', tgError);
    } else {
      console.log('✅ Deleted all tournament golfers');
    }

    // 7. Delete tournaments
    console.log('\nStep 7: Deleting tournaments...');
    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (tournamentsError) {
      console.error('❌ Error deleting tournaments:', tournamentsError);
    } else {
      console.log('✅ Deleted all tournaments');
    }

    // Verify what's left
    console.log('\n✅ InPlay platform cleared successfully!\n');
    console.log('📊 Verification:');
    
    const { count: clubhouseEvents } = await supabase
      .from('clubhouse_events')
      .select('*', { count: 'exact', head: true });
    console.log(`   - Clubhouse events: ${clubhouseEvents} (preserved)`);
    
    const { count: one2oneComps } = await supabase
      .from('tournament_competitions')
      .select('*', { count: 'exact', head: true })
      .eq('competition_format', 'one2one');
    console.log(`   - ONE 2 ONE challenges: ${one2oneComps} (preserved)`);
    
    const { count: clubhouseEntries } = await supabase
      .from('clubhouse_entries')
      .select('*', { count: 'exact', head: true });
    console.log(`   - Clubhouse entries: ${clubhouseEntries} (preserved)`);

    const { count: remainingTournaments } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact', head: true });
    console.log(`   - InPlay tournaments: ${remainingTournaments} (should be 0)`);

    const { count: remainingInplayComps } = await supabase
      .from('tournament_competitions')
      .select('*', { count: 'exact', head: true })
      .eq('competition_format', 'inplay');
    console.log(`   - InPlay competitions: ${remainingInplayComps} (should be 0)`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

clearInPlayData().then(() => process.exit(0));
