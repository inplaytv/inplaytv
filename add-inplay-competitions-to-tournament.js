require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addCompetitionsToLatestTournament() {
  console.log('=== ADDING 6 INPLAY COMPETITIONS TO LATEST TOURNAMENT ===\n');

  // Get the most recent tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tournamentError || !tournament) {
    console.error('❌ Failed to find tournament:', tournamentError);
    return;
  }

  console.log(`📋 Tournament: ${tournament.name}`);
  console.log(`   ID: ${tournament.id}`);
  console.log(`   Status: ${tournament.status}\n`);

  // Get the 6 main competition types
  const mainSlugs = [
    'full-course-all-4-rounds',
    'beat-the-cut',
    'the-weekender',
    'be-the-first-to-strike',
    'second-round',
    'third-round'
  ];

  const { data: competitionTypes, error: typesError } = await supabase
    .from('competition_types')
    .select('*')
    .in('slug', mainSlugs);

  if (typesError || !competitionTypes || competitionTypes.length === 0) {
    console.error('❌ Failed to fetch competition types:', typesError);
    return;
  }

  console.log(`Found ${competitionTypes.length} competition types\n`);

  // Check if competitions already exist
  const { data: existingComps } = await supabase
    .from('tournament_competitions')
    .select('id, competition_type_id')
    .eq('tournament_id', tournament.id);

  if (existingComps && existingComps.length > 0) {
    console.log(`⚠️  Tournament already has ${existingComps.length} competitions`);
    console.log('   Deleting them first...\n');
    
    await supabase
      .from('tournament_competitions')
      .delete()
      .eq('tournament_id', tournament.id);
  }

  // Create competitions
  const competitionsToInsert = competitionTypes.map(ct => ({
    tournament_id: tournament.id,
    competition_type_id: ct.id,
    competition_format: 'inplay', // CRITICAL!
    entry_fee_pennies: ct.default_entry_fee_pennies || 1000,
    entrants_cap: ct.default_entrants_cap || 100,
    admin_fee_percent: ct.default_admin_fee_percent || 10,
    status: 'draft',
    reg_open_at: tournament.registration_opens_at,
    reg_close_at: tournament.registration_closes_at,
    start_at: tournament.start_date,
    end_at: tournament.end_date,
  }));

  console.log('Creating competitions:\n');
  competitionsToInsert.forEach(comp => {
    const type = competitionTypes.find(ct => ct.id === comp.competition_type_id);
    console.log(`  - ${type?.name} (${type?.slug})`);
    console.log(`    Format: ${comp.competition_format}`);
    console.log(`    Entry Fee: £${comp.entry_fee_pennies / 100}`);
    console.log(`    Cap: ${comp.entrants_cap} players\n`);
  });

  const { data: insertedComps, error: insertError } = await supabase
    .from('tournament_competitions')
    .insert(competitionsToInsert)
    .select('id, competition_type_id, competition_format');

  if (insertError) {
    console.error('❌ Failed to insert competitions:', insertError);
    return;
  }

  console.log(`\n✅ Successfully created ${insertedComps.length} InPlay competitions!\n`);

  // Verify
  const { data: verification } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      competition_format,
      status,
      competition_types(name, slug)
    `)
    .eq('tournament_id', tournament.id);

  console.log('=== VERIFICATION ===');
  verification?.forEach(comp => {
    console.log(`✓ ${comp.competition_types.name}`);
    console.log(`  Format: ${comp.competition_format}`);
    console.log(`  Status: ${comp.status}\n`);
  });

  // Check for any ONE 2 ONE mistakes
  const one2oneCount = verification?.filter(c => c.competition_format === 'one2one').length || 0;
  if (one2oneCount > 0) {
    console.error(`❌ ERROR: Found ${one2oneCount} ONE 2 ONE competitions! These should not exist!`);
  } else {
    console.log('✅ No ONE 2 ONE competitions found (correct!)');
  }
}

addCompetitionsToLatestTournament().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
