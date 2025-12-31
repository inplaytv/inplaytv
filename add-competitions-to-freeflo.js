require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCompetitionsToFreeflo() {
  console.log('\n=== ADDING COMPETITIONS TO FREEFLO TOURNAMENT ===\n');
  
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
  
  // Get all 6 main competition types
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
  
  console.log(`\nFound ${compTypes.length} competition types to add`);
  
  // Create competitions for each type
  const competitionsToInsert = compTypes.map(ct => ({
    tournament_id: tournament.id,
    competition_type_id: ct.id,
    entry_fee_pennies: ct.default_entry_fee_pennies || 1000, // £10 default
    entrants_cap: ct.default_entrants_cap || 100,
    admin_fee_percent: ct.default_admin_fee_percent || 10,
    status: 'draft',
  }));
  
  console.log('\nCreating competitions...');
  compTypes.forEach((ct, i) => {
    console.log(`  ${i+1}. ${ct.name} - £${competitionsToInsert[i].entry_fee_pennies / 100} entry, cap: ${competitionsToInsert[i].entrants_cap}`);
  });
  
  const { data: createdComps, error: insertError } = await supabase
    .from('tournament_competitions')
    .insert(competitionsToInsert)
    .select();
  
  if (insertError) {
    console.error('\n❌ Failed to create competitions:', insertError);
    process.exit(1);
  }
  
  console.log(`\n✅ Successfully created ${createdComps.length} competitions for ${tournament.name}`);
  console.log('\nNow go to the tournament settings page to:');
  console.log('  1. Set round tee times via Lifecycle Manager');
  console.log('  2. Sync golfers from DataGolf');
  console.log('  3. Assign golfer groups to competitions');
  
  process.exit(0);
}

addCompetitionsToFreeflo();
