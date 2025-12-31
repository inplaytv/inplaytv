require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteInvalidCompetitions() {
  console.log('\n=== CHECKING FOR ENTRIES BEFORE DELETION ===\n');
  
  // Get all invalid competition IDs
  const { data: invalidComps } = await supabase
    .from('tournament_competitions')
    .select('id')
    .is('competition_type_id', null);
  
  const invalidIds = invalidComps.map(c => c.id);
  console.log(`Found ${invalidIds.length} invalid competitions to delete`);
  
  // Check for any entries
  const { data: entries, error: entriesError } = await supabase
    .from('competition_entries')
    .select('id, competition_id, user_id')
    .in('competition_id', invalidIds);
  
  if (entriesError) {
    console.error('Error checking entries:', entriesError);
    process.exit(1);
  }
  
  console.log(`\nFound ${entries.length} entries referencing these competitions`);
  
  if (entries.length > 0) {
    console.log('\n⚠️  WARNING: Entries exist! Need to delete entries first:');
    console.table(entries);
    
    console.log('\n🗑️  Deleting entry picks first...');
    const entryIds = entries.map(e => e.id);
    
    const { error: picksError } = await supabase
      .from('entry_picks')
      .delete()
      .in('entry_id', entryIds);
    
    if (picksError) {
      console.error('Error deleting picks:', picksError);
      process.exit(1);
    }
    console.log('✅ Deleted picks');
    
    console.log('\n🗑️  Deleting entries...');
    const { error: deleteEntriesError } = await supabase
      .from('competition_entries')
      .delete()
      .in('id', entryIds);
    
    if (deleteEntriesError) {
      console.error('Error deleting entries:', deleteEntriesError);
      process.exit(1);
    }
    console.log(`✅ Deleted ${entries.length} entries`);
  }
  
  // Now delete the invalid competitions
  console.log(`\n🗑️  Deleting ${invalidIds.length} invalid competitions...`);
  const { error: deleteError } = await supabase
    .from('tournament_competitions')
    .delete()
    .in('id', invalidIds);
  
  if (deleteError) {
    console.error('Error deleting competitions:', deleteError);
    process.exit(1);
  }
  
  console.log(`✅ Successfully deleted ${invalidIds.length} invalid competitions`);
  console.log('\n✨ Cleanup complete! Tournament pages should work now.');
  
  process.exit(0);
}

deleteInvalidCompetitions();
