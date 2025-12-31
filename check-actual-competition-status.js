require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  console.log('\n=== CHECKING ACTUAL DATABASE STATE ===\n');
  
  // 1. Get all tournaments to find the right one
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (!tournaments || tournaments.length === 0) {
    console.log('❌ NO TOURNAMENTS FOUND IN DATABASE');
    console.log('Database connection issue or empty database');
    return;
  }
  
  console.log('Recent tournaments:');
  tournaments.forEach(t => console.log(`  - ${t.name} (${t.slug})`));
  
  // 2. Find the one with "Third Round" competition
  let targetTournament = null;
  for (const t of tournaments) {
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('id, status, competition_types(name)')
      .eq('tournament_id', t.id)
      .eq('competition_format', 'inplay');
    
    if (comps && comps.some(c => c.competition_types?.name?.includes('Third Round'))) {
      targetTournament = t;
      break;
    }
  }
  
  if (!targetTournament) {
    console.log('\n❌ Could not find tournament with "Third Round" competition');
    return;
  }
  
  console.log(`\n=== Found Tournament: ${targetTournament.name} ===`);
  console.log(`Slug: ${targetTournament.slug}`);
  
  // 3. Get ALL competitions for this tournament
  const { data: allComps } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      competition_format,
      competition_types (name, slug)
    `)
    .eq('tournament_id', targetTournament.id)
    .eq('competition_format', 'inplay');
  
  console.log(`\n--- ALL ${allComps?.length || 0} InPlay Competitions ---`);
  if (allComps) {
    allComps.forEach(c => {
      console.log(`\n${c.competition_types?.name}:`);
      console.log(`  Status in DB: "${c.status}"`);
      console.log(`  Reg Close: ${c.reg_close_at || 'NULL'}`);
    });
  }
  
  // 4. Test the API filter that was supposedly "fixed"
  const { data: filteredComps } = await supabase
    .from('tournament_competitions')
    .select('id, status, competition_types(name)')
    .eq('tournament_id', targetTournament.id)
    .eq('competition_format', 'inplay')
    .in('status', ['draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed']);
  
  console.log(`\n--- With NEW API Filter (what I just changed) ---`);
  console.log(`Filter: ['draft', 'upcoming', 'registration_open', 'registration_closed', 'live', 'completed']`);
  console.log(`Results: ${filteredComps?.length || 0} competitions`);
  
  if (filteredComps && filteredComps.length > 0) {
    filteredComps.forEach(c => console.log(`  ✅ ${c.competition_types?.name} (${c.status})`));
  }
  
  // 5. Test OLD filter
  const { data: oldFilterComps } = await supabase
    .from('tournament_competitions')
    .select('id, status, competition_types(name)')
    .eq('tournament_id', targetTournament.id)
    .eq('competition_format', 'inplay')
    .in('status', ['upcoming', 'reg_open', 'reg_closed', 'live']);
  
  console.log(`\n--- With OLD API Filter (before my change) ---`);
  console.log(`Filter: ['upcoming', 'reg_open', 'reg_closed', 'live']`);
  console.log(`Results: ${oldFilterComps?.length || 0} competitions`);
  
  if (oldFilterComps && oldFilterComps.length > 0) {
    oldFilterComps.forEach(c => console.log(`  ✅ ${c.competition_types?.name} (${c.status})`));
  }
  
  // 6. Summary
  console.log('\n=== DIAGNOSIS ===');
  if (allComps?.length === 0) {
    console.log('❌ PROBLEM: No competitions exist for this tournament in database');
  } else if (filteredComps?.length === allComps?.length) {
    console.log('✅ My fix works - API now returns all competitions');
  } else if (filteredComps?.length === 0) {
    console.log('❌ PROBLEM: Competitions exist but API filter excludes them');
    console.log('   Actual status values in DB don\'t match filter');
  } else {
    console.log(`⚠️  PARTIAL: API returns ${filteredComps?.length} of ${allComps?.length} competitions`);
  }
  
})();
