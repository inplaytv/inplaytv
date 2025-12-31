require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function comprehensiveSearch() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== COMPREHENSIVE DATABASE SEARCH ===\n');

  // 1. Count ALL tournaments ever created
  const { data: allTournaments, error: tError } = await supabase
    .from('tournaments')
    .select('id, name, status, created_at, is_visible')
    .order('created_at', { ascending: false });

  console.log(`1. TOTAL TOURNAMENTS IN DATABASE: ${allTournaments?.length || 0}\n`);
  if (allTournaments && allTournaments.length > 0) {
    allTournaments.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name}`);
      console.log(`      Created: ${t.created_at}`);
      console.log(`      Status: ${t.status}`);
      console.log(`      Visible: ${t.is_visible}`);
    });
  }

  // 2. Count ALL competitions ever created
  const { data: allCompetitions } = await supabase
    .from('tournament_competitions')
    .select('id, name, tournament_id, status, created_at')
    .order('created_at', { ascending: false });

  console.log(`\n2. TOTAL COMPETITIONS IN DATABASE: ${allCompetitions?.length || 0}\n`);

  // 3. Check for deleted tournaments (soft delete?)
  const { data: deletedTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status')
    .eq('is_visible', false);

  console.log(`\n3. HIDDEN (is_visible=false) TOURNAMENTS: ${deletedTournaments?.length || 0}\n`);
  if (deletedTournaments && deletedTournaments.length > 0) {
    deletedTournaments.forEach(t => {
      console.log(`   • ${t.name} (${t.status})`);
    });
  }

  // 4. Check competition_types table
  const { data: compTypes } = await supabase
    .from('competition_types')
    .select('*')
    .order('name');

  console.log(`\n4. COMPETITION TYPES: ${compTypes?.length || 0}\n`);
  if (compTypes) {
    compTypes.forEach(ct => {
      console.log(`   • ${ct.name} (${ct.slug})`);
    });
  }

  // 5. Check total entries
  const { data: allEntries } = await supabase
    .from('competition_entries')
    .select('id, competition_id, status, created_at');

  console.log(`\n5. TOTAL ENTRIES IN DATABASE: ${allEntries?.length || 0}`);
  
  const entryStatuses = {};
  allEntries?.forEach(e => {
    entryStatuses[e.status] = (entryStatuses[e.status] || 0) + 1;
  });
  console.log('   Status breakdown:');
  Object.entries(entryStatuses).forEach(([status, count]) => {
    console.log(`   • ${status}: ${count}`);
  });

  // 6. Check for competition names being NULL
  const { data: namedComps } = await supabase
    .from('tournament_competitions')
    .select('id, name, competition_type_id')
    .not('name', 'is', null);

  const { data: nullNameComps } = await supabase
    .from('tournament_competitions')
    .select('id, name, competition_type_id')
    .is('name', null);

  console.log(`\n6. COMPETITION NAMES:`);
  console.log(`   With names: ${namedComps?.length || 0}`);
  console.log(`   NULL names: ${nullNameComps?.length || 0}`);

  // 7. Search for "FINAL STRIKE" in all text fields
  console.log(`\n7. SEARCHING FOR "FINAL STRIKE":`);
  
  const { data: finalStrikeTourney } = await supabase
    .from('tournaments')
    .select('*')
    .or('name.ilike.%final%,name.ilike.%strike%,description.ilike.%final%,description.ilike.%strike%');
  
  console.log(`   In tournaments: ${finalStrikeTourney?.length || 0}`);
  if (finalStrikeTourney && finalStrikeTourney.length > 0) {
    finalStrikeTourney.forEach(t => console.log(`     • ${t.name}`));
  }

  const { data: finalStrikeComp } = await supabase
    .from('tournament_competitions')
    .select('*, tournaments(name)')
    .or('name.ilike.%final%,name.ilike.%strike%');
  
  console.log(`   In competitions: ${finalStrikeComp?.length || 0}`);
  if (finalStrikeComp && finalStrikeComp.length > 0) {
    finalStrikeComp.forEach(c => console.log(`     • ${c.name} (${c.tournaments?.name})`));
  }

  // 8. Check golfer_groups
  const { data: allGroups } = await supabase
    .from('golfer_groups')
    .select('id, name, tournament_id, created_at')
    .order('created_at', { ascending: false });

  console.log(`\n8. TOTAL GOLFER GROUPS: ${allGroups?.length || 0}\n`);
  if (allGroups && allGroups.length > 10) {
    console.log(`   (Showing first 10...)`);
    allGroups.slice(0, 10).forEach(g => {
      console.log(`   • ${g.name}`);
    });
  } else if (allGroups) {
    allGroups.forEach(g => {
      console.log(`   • ${g.name}`);
    });
  }

  // 9. Check for any competition without golfer group assigned
  const { data: unassignedComps } = await supabase
    .from('tournament_competitions')
    .select('id, name, tournament_id, tournaments(name)')
    .is('assigned_golfer_group_id', null)
    .eq('competition_format', 'inplay');

  console.log(`\n9. INPLAY COMPETITIONS WITHOUT GOLFER GROUP: ${unassignedComps?.length || 0}\n`);
  if (unassignedComps && unassignedComps.length > 0) {
    unassignedComps.forEach(c => {
      console.log(`   • ${c.name || 'UNNAMED'} (${c.tournaments?.name})`);
    });
  }

  console.log('\n=== END COMPREHENSIVE SEARCH ===\n');
}

comprehensiveSearch().catch(console.error);
