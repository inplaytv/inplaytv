require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearInPlayData() {
  console.log('🗑️  CLEARING INPLAY DATA ONLY\n');
  console.log('⚠️  WILL NOT TOUCH:');
  console.log('   - ONE 2 ONE challenges (competition_format = "one2one")');
  console.log('   - Clubhouse events and entries (clubhouse_* tables)');
  console.log('   - User data, wallets, profiles\n');

  try {
    // Step 1: Get InPlay competition IDs
    console.log('Step 1: Finding InPlay competitions...');
    const { data: inplayComps, error: compError } = await supabase
      .from('tournament_competitions')
      .select('id')
      .eq('competition_format', 'inplay');
    
    if (compError) throw compError;
    
    const inplayCompIds = inplayComps?.map(c => c.id) || [];
    console.log(`  Found ${inplayCompIds.length} InPlay competitions`);

    if (inplayCompIds.length === 0) {
      console.log('\n✅ No InPlay competitions found. Nothing to delete.');
      return;
    }

    // Step 2: Delete competition entry picks for InPlay entries
    console.log('\nStep 2: Deleting competition entry picks...');
    const { data: inplayEntries } = await supabase
      .from('competition_entries')
      .select('id')
      .in('competition_id', inplayCompIds);
    
    const inplayEntryIds = inplayEntries?.map(e => e.id) || [];
    console.log(`  Found ${inplayEntryIds.length} InPlay entries`);

    if (inplayEntryIds.length > 0) {
      const { error: picksError } = await supabase
        .from('competition_entry_picks')
        .delete()
        .in('entry_id', inplayEntryIds);
      
      if (picksError) throw picksError;
      console.log('  ✅ Deleted entry picks');
    }

    // Step 3: Delete competition entries (InPlay only)
    console.log('\nStep 3: Deleting InPlay competition entries...');
    const { error: entriesError } = await supabase
      .from('competition_entries')
      .delete()
      .in('competition_id', inplayCompIds);
    
    if (entriesError) throw entriesError;
    console.log('  ✅ Deleted InPlay entries');

    // Step 4: Delete InPlay competitions
    console.log('\nStep 4: Deleting InPlay competitions...');
    const { error: deleteCompError } = await supabase
      .from('tournament_competitions')
      .delete()
      .eq('competition_format', 'inplay');
    
    if (deleteCompError) throw deleteCompError;
    console.log('  ✅ Deleted InPlay competitions');

    // Step 5: Delete tournament golfers
    console.log('\nStep 5: Deleting tournament golfers...');
    const { error: tgError } = await supabase
      .from('tournament_golfers')
      .delete()
      .neq('tournament_id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (tgError) throw tgError;
    console.log('  ✅ Deleted tournament golfers');

    // Step 6: Delete tournaments
    console.log('\nStep 6: Deleting tournaments...');
    const { error: tournamentsError } = await supabase
      .from('tournaments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (tournamentsError) throw tournamentsError;
    console.log('  ✅ Deleted tournaments');

    // Verification
    console.log('\n📊 Verification:');
    const { data: remainingInplay } = await supabase
      .from('tournament_competitions')
      .select('id')
      .eq('competition_format', 'inplay');
    
    const { data: remainingOne2One } = await supabase
      .from('tournament_competitions')
      .select('id')
      .eq('competition_format', 'one2one');

    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('id');

    console.log(`   InPlay competitions remaining: ${remainingInplay?.length || 0}`);
    console.log(`   ONE 2 ONE challenges remaining: ${remainingOne2One?.length || 0} ✅`);
    console.log(`   Tournaments remaining: ${tournaments?.length || 0}`);

    console.log('\n✨ InPlay platform cleared successfully!');
    console.log('\n⚠️  Preserved:');
    console.log(`   - ${remainingOne2One?.length || 0} ONE 2 ONE challenges`);
    console.log('   - All Clubhouse events and entries');
    console.log('   - All user data, wallets, and profiles');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

clearInPlayData().then(() => process.exit(0));
