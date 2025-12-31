require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function fullDiagnostic() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      db: { schema: 'public' },
      auth: { autoRefreshToken: false, persistSession: false }
    }
  );

  console.log('\n=== COMPREHENSIVE DIAGNOSTIC (CORRECT SCHEMA) ===\n');

  // 1. Tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible')
    .order('created_at', { ascending: false });

  console.log(`✓ Tournaments: ${tournaments?.length || 0}`);
  tournaments?.forEach(t => {
    console.log(`  • ${t.name}`);
    console.log(`    Slug: ${t.slug}`);
    console.log(`    Status: ${t.status}, Visible: ${t.is_visible}`);
  });

  // 2. Competitions (WITHOUT name column, join to types)
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      tournament_id,
      competition_type_id,
      competition_format,
      status,
      assigned_golfer_group_id,
      rounds_covered,
      max_players,
      current_players,
      entry_fee_pennies
    `)
    .order('created_at', { ascending: false });

  console.log(`\n✓ Competitions: ${competitions?.length || 0}`);
  
  // Group by tournament
  const byTournament = {};
  competitions?.forEach(c => {
    if (!byTournament[c.tournament_id]) {
      byTournament[c.tournament_id] = [];
    }
    byTournament[c.tournament_id].push(c);
  });

  for (const [tournId, comps] of Object.entries(byTournament)) {
    const tourn = tournaments?.find(t => t.id === tournId);
    console.log(`\n  Tournament: ${tourn?.name || tournId}`);
    console.log(`  ${comps.length} competitions:`);
    
    for (const c of comps) {
      console.log(`    • ID: ${c.id.substring(0, 8)}...`);
      console.log(`      Format: ${c.competition_format}`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Type ID: ${c.competition_type_id?.substring(0, 8) || 'NULL (ONE 2 ONE)'}`);
      console.log(`      Group ID: ${c.assigned_golfer_group_id?.substring(0, 8) || 'None'}...`);
      console.log(`      Players: ${c.current_players || 0}/${c.max_players || 'unlimited'}`);
      if (c.rounds_covered) {
        console.log(`      Rounds: [${c.rounds_covered.join(', ')}]`);
      }
    }
  }

  // 3. Competition Types (to see FINAL STRIKE)
  const { data: types } = await supabase
    .from('competition_types')
    .select('id, name, competition_format')
    .order('name');

  console.log(`\n\n✓ Competition Types: ${types?.length || 0}`);
  types?.forEach(t => {
    console.log(`  • ${t.name} (${t.competition_format})`);
  });

  // 4. Golfer Groups
  const { data: groups } = await supabase
    .from('golfer_groups')
    .select('id, name, tournament_id')
    .order('created_at', { ascending: false });

  console.log(`\n✓ Golfer Groups: ${groups?.length || 0}`);
  groups?.forEach(g => {
    const tourn = tournaments?.find(t => t.id === g.tournament_id);
    console.log(`  • ${g.name}`);
    console.log(`    Tournament: ${tourn?.name || g.tournament_id}`);
  });

  // 5. Entries
  const { data: entries } = await supabase
    .from('competition_entries')
    .select('id, competition_id, instance_id, status, user_id')
    .order('created_at', { ascending: false })
    .limit(20);

  console.log(`\n✓ Competition Entries: ${entries?.length || 0}`);
  const statusCounts = {};
  entries?.forEach(e => {
    statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
  });
  console.log('  Status breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`    ${status}: ${count}`);
  });

  console.log('\n=== DIAGNOSTIC COMPLETE ===\n');
  console.log('Summary:');
  console.log(`  - ${tournaments?.length || 0} tournaments`);
  console.log(`  - ${competitions?.length || 0} competitions`);
  console.log(`  - ${types?.length || 0} competition types`);
  console.log(`  - ${groups?.length || 0} golfer groups`);
  console.log(`  - ${entries?.length || 0} entries`);
}

fullDiagnostic().catch(console.error);
