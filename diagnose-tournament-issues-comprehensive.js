require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function diagnose() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { db: { schema: 'public' }, auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('\n=== COMPREHENSIVE TOURNAMENT DIAGNOSIS ===\n');

  // 1. Check all tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible, start_date, end_date')
    .order('created_at', { ascending: false });

  console.log('=== ALL TOURNAMENTS ===\n');
  tournaments?.forEach(t => {
    console.log(`Tournament: ${t.name}`);
    console.log(`  Slug: ${t.slug}`);
    console.log(`  Status: ${t.status}`);
    console.log(`  Visible: ${t.is_visible}`);
    console.log(`  Dates: ${t.start_date} to ${t.end_date}`);
    console.log('');
  });

  // 2. Check WESTGATE competitions and entries
  const westgate = tournaments?.find(t => t.name.includes('WESTGATE'));
  if (westgate) {
    console.log('=== WESTGATE & BIRCHINGTON DETAILS ===\n');
    
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('id, competition_format, status, competition_types(name)')
      .eq('tournament_id', westgate.id);
    
    console.log(`Competitions: ${comps.length}`);
    comps?.forEach(c => {
      console.log(`  - ${c.competition_types?.name || 'ONE 2 ONE'} (${c.competition_format}): ${c.status}`);
    });

    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, status, competition_id')
      .in('competition_id', comps.map(c => c.id));

    console.log(`\nEntries: ${entries.length}`);
    entries?.forEach(e => {
      const comp = comps.find(c => c.id === e.competition_id);
      console.log(`  - Entry ${e.id.substring(0,8)}... for ${comp?.competition_types?.name || 'ONE 2 ONE'}: ${e.status}`);
    });
  }

  // 3. Check Northforland
  const northforland = tournaments?.find(t => t.name.includes('Northforland'));
  if (northforland) {
    console.log('\n=== NORTHFORLAND OPEN DETAILS ===\n');
    
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('id, competition_format, status, assigned_golfer_group_id, competition_types(name)')
      .eq('tournament_id', northforland.id);
    
    console.log(`Competitions: ${comps.length}`);
    comps?.forEach(c => {
      console.log(`  - ${c.competition_types?.name || 'ONE 2 ONE'} (${c.competition_format}): ${c.status}`);
      console.log(`    Golfer Group: ${c.assigned_golfer_group_id ? c.assigned_golfer_group_id.substring(0,8) + '...' : 'NONE!'}`);
    });

    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, status, competition_id')
      .in('competition_id', comps.map(c => c.id));

    console.log(`\nEntries: ${entries.length}`);
    entries?.forEach(e => {
      const comp = comps.find(c => c.id === e.competition_id);
      console.log(`  - Entry ${e.id.substring(0,8)}... for ${comp?.competition_types?.name || 'ONE 2 ONE'}: ${e.status}`);
    });

    // Check golfer groups
    const { data: groups } = await supabase
      .from('golfer_groups')
      .select('id, name')
      .eq('tournament_id', northforland.id);

    console.log(`\nGolfer Groups: ${groups?.length || 0}`);
    groups?.forEach(g => {
      console.log(`  - ${g.name} (${g.id.substring(0,8)}...)`);
    });
  }

  // 4. Check for "FINAL STRIKE" tournament (not competition type)
  const finalStrike = tournaments?.find(t => t.name.toUpperCase().includes('FINAL STRIKE'));
  console.log('\n=== FINAL STRIKE TOURNAMENT SEARCH ===\n');
  if (finalStrike) {
    console.log(`Found: ${finalStrike.name}`);
    console.log(`  Slug: ${finalStrike.slug}`);
    console.log(`  Status: ${finalStrike.status}`);
    console.log(`  Visible: ${finalStrike.is_visible}`);
  } else {
    console.log('❌ No tournament named "FINAL STRIKE" found');
    console.log('\nSearching for competitions with Final Strike type...');
    
    const { data: finalStrikeComps } = await supabase
      .from('tournament_competitions')
      .select('id, status, tournament_id, tournaments(name), competition_types(name)')
      .eq('competition_types.name', 'Final Strike');
    
    if (finalStrikeComps && finalStrikeComps.length > 0) {
      console.log(`\nFound ${finalStrikeComps.length} Final Strike COMPETITIONS:`);
      finalStrikeComps.forEach(c => {
        console.log(`  - In tournament: ${c.tournaments.name}`);
        console.log(`    Status: ${c.status}`);
      });
    } else {
      console.log('No competitions using "Final Strike" type found either');
    }
  }

  // 5. Check what tournaments page query would return
  console.log('\n=== TOURNAMENTS PAGE QUERY SIMULATION ===\n');
  const today = new Date().toISOString().split('T')[0];
  const { data: visibleTournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible, end_date')
    .eq('is_visible', true)
    .gte('end_date', today)
    .in('status', ['upcoming', 'registration_open', 'registration_closed', 'live'])
    .order('start_date');

  console.log(`Query filters:`);
  console.log(`  - is_visible = true`);
  console.log(`  - end_date >= ${today}`);
  console.log(`  - status IN (upcoming, registration_open, registration_closed, live)`);
  console.log(`\nResults: ${visibleTournaments?.length || 0} tournaments would show\n`);
  
  visibleTournaments?.forEach(t => {
    console.log(`✓ ${t.name}`);
    console.log(`  Status: ${t.status}, End: ${t.end_date}`);
  });

  console.log('\n=== DIAGNOSIS COMPLETE ===\n');
}

diagnose().catch(console.error);
