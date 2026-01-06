require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔧 Applying competition_format fix...\n');
  
  // Step 1: Get all competitions
  const { data: competitions, error: fetchError } = await supabase
    .from('tournament_competitions')
    .select('id, competition_format, competition_type_id, rounds_covered');
  
  if (fetchError) {
    console.error('❌ Error fetching competitions:', fetchError);
    return;
  }
  
  console.log(`Found ${competitions.length} competitions\n`);
  
  // Step 2: Update each competition based on unified system rules
  let updated = 0;
  let skipped = 0;
  
  for (const comp of competitions) {
    // Skip if already has format
    if (comp.competition_format) {
      console.log(`⏭️  Skipping competition ${comp.id.substring(0, 8)} - already has format: ${comp.competition_format}`);
      skipped++;
      continue;
    }
    
    // Determine format based on unified system rules:
    // - InPlay: has competition_type_id
    // - ONE 2 ONE: has rounds_covered (and typically no competition_type_id)
    let newFormat;
    if (comp.competition_type_id !== null) {
      newFormat = 'inplay';
    } else if (comp.rounds_covered !== null && comp.rounds_covered.length > 0) {
      newFormat = 'one2one';
    } else {
      // Default to inplay for admin-created competitions
      newFormat = 'inplay';
    }
    
    // Update the competition
    const { error: updateError } = await supabase
      .from('tournament_competitions')
      .update({ competition_format: newFormat })
      .eq('id', comp.id);
    
    if (updateError) {
      console.error(`❌ Error updating ${comp.id.substring(0, 8)}:`, updateError);
    } else {
      console.log(`✅ Updated competition ${comp.id.substring(0, 8)} → competition_format: '${newFormat}'`);
      updated++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📝 Total: ${competitions.length}`);
  
  // Step 3: Verify the fix
  console.log(`\n🔍 Verifying fix...`);
  const { data: verification } = await supabase
    .from('tournament_competitions')
    .select('competition_format')
    .is('competition_format', null);
  
  if (verification && verification.length === 0) {
    console.log(`✅ SUCCESS: All competitions now have competition_format set!`);
  } else {
    console.log(`⚠️  WARNING: ${verification?.length || 0} competitions still have NULL format`);
  }
})();
