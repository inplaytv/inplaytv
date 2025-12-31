require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFreefloCompetitions() {
  console.log('\n=== FIXING FREEFLO COMPETITIONS ===\n');
  
  // Find the FREEFLO tournament
  const { data: tournament, error: tournError } = await supabase
    .from('tournaments')
    .select('id, name')
    .ilike('name', '%freeflo%')
    .single();
  
  if (tournError || !tournament) {
    console.error('Tournament not found:', tournError);
    process.exit(1);
  }
  
  console.log(`Found tournament: ${tournament.name} (${tournament.id})`);
  
  // Delete ALL existing competitions for this tournament
  const { error: deleteError } = await supabase
    .from('tournament_competitions')
    .delete()
    .eq('tournament_id', tournament.id);
  
  if (deleteError) {
    console.error('Failed to delete existing competitions:', deleteError);
    process.exit(1);
  }
  
  console.log('✅ Deleted all existing competitions');
  
  // Get the 6 main competition types
  const mainSlugs = [
    'full-course-all-4-rounds',
    'beat-the-cut',
    'the-weekender',
    'be-the-first-to-strike',
    'second-round',
    'third-round'
  ];
  
  const { data: compTypes, error: typesError } = await supabase
    .from('competition_types')
    .select('*')
    .in('slug', mainSlugs);
  
  if (typesError || !compTypes) {
    console.error('Failed to fetch competition types:', typesError);
    process.exit(1);
  }
  
  console.log(`\nFound ${compTypes.length} competition types`);
  
  // Create competitions with proper competition_type_id
  const competitionsToInsert = compTypes.map(ct => ({
    tournament_id: tournament.id,
    competition_type_id: ct.id,
    entry_fee_pennies: ct.default_entry_fee_pennies || 1000,
    entrants_cap: ct.default_entrants_cap || 100,
    admin_fee_percent: ct.default_admin_fee_percent || 10,
    status: 'draft',
  }));
  
  console.log('\nCreating competitions:');
  compTypes.forEach((ct, i) => {
    console.log(`  ${i+1}. ${ct.name} (${ct.slug})`);
    console.log(`     Type ID: ${ct.id}`);
    console.log(`     Fee: £${competitionsToInsert[i].entry_fee_pennies / 100}, Cap: ${competitionsToInsert[i].entrants_cap}`);
  });
  
  const { data: createdComps, error: insertError } = await supabase
    .from('tournament_competitions')
    .insert(competitionsToInsert)
    .select(`
      *,
      competition_types (
        id,
        name,
        slug
      )
    `);
  
  if (insertError) {
    console.error('\n❌ Failed to create competitions:', insertError);
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully created ${createdComps.length} competitions`);
  console.log('\nVerifying competition_types join:');
  createdComps.forEach((comp, i) => {
    console.log(`  ${i+1}. ${comp.competition_types?.name || 'MISSING NAME!'} - Type ID: ${comp.competition_type_id}`);
  });
  
  process.exit(0);
}

fixFreefloCompetitions();
