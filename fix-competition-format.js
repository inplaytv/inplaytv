require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixExistingCompetitions() {
  console.log('🔧 Fixing existing competitions...\n');
  
  // Get all competitions WITHOUT competition_format set
  const { data: unformatted } = await supabase
    .from('tournament_competitions')
    .select('id, tournament_id, competition_type_id, rounds_covered')
    .is('competition_format', null);
  
  console.log(`Found ${unformatted?.length || 0} competitions without competition_format`);
  
  if (!unformatted || unformatted.length === 0) {
    console.log('✅ No fixes needed!');
    return;
  }
  
  // Determine format for each competition
  const updates = unformatted.map(comp => {
    // If it has competition_type_id, it's InPlay
    // If it has rounds_covered (and no type_id), it's ONE 2 ONE
    let format = null;
    
    if (comp.competition_type_id !== null) {
      format = 'inplay';
    } else if (comp.rounds_covered !== null && comp.rounds_covered.length > 0) {
      format = 'one2one';
    } else {
      // Default to inplay for admin-created competitions
      format = 'inplay';
    }
    
    return {
      id: comp.id,
      format: format
    };
  });
  
  console.log('\nUpdating competitions:');
  
  // Update each competition
  for (const update of updates) {
    const { error } = await supabase
      .from('tournament_competitions')
      .update({ competition_format: update.format })
      .eq('id', update.id);
    
    if (error) {
      console.log(`  ❌ Failed to update ${update.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Set ${update.id} to '${update.format}'`);
    }
  }
  
  console.log('\n✅ All competitions updated!');
}

fixExistingCompetitions();
