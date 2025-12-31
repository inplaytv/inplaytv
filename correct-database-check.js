require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkDatabase() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('\n=== CORRECT DATABASE CHECK ===\n');

  // Get tournaments
  const { data: tournaments, error: tourError } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible')
    .order('created_at', { ascending: false });

  console.log(`✓ Tournaments: ${tournaments?.length || 0}`);
  if (tournaments) {
    tournaments.forEach(t => {
      console.log(`  • ${t.name} (${t.slug})`);
      console.log(`    Status: ${t.status}, Visible: ${t.is_visible}`);
    });
  }

  // Get competitions WITH names properly
  const { data: competitions, error: compError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      name,
      tournament_id,
      competition_type_id,
      competition_format,
      status,
      assigned_golfer_group_id,
      competition_types (
        name
      )
    `)
    .order('created_at', { ascending: false });

  console.log(`\n✓ Competitions: ${competitions?.length || 0}`);
  if (competitions) {
    competitions.forEach(c => {
      console.log(`  • ID: ${c.id}`);
      console.log(`    Name: ${c.name || 'NULL'}`);
      console.log(`    Type: ${c.competition_types?.name || 'No type linked'}`);
      console.log(`    Format: ${c.competition_format}`);
      console.log(`    Status: ${c.status}`);
      console.log(`    Group ID: ${c.assigned_golfer_group_id || 'None'}`);
    });
  }

  // Get golfer groups
  const { data: groups, error: groupError } = await supabase
    .from('golfer_groups')
    .select('id, name, tournament_id')
    .order('created_at', { ascending: false });

  console.log(`\n✓ Golfer Groups: ${groups?.length || 0}`);
  if (groups) {
    groups.forEach(g => {
      console.log(`  • ${g.name} (ID: ${g.id})`);
    });
  }

  // Get entries with proper joins
  const { data: entries, error: entryError } = await supabase
    .from('competition_entries')
    .select(`
      id,
      competition_id,
      instance_id,
      status,
      tournament_competitions (
        name,
        competition_types (name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  console.log(`\n✓ Entries: ${entries?.length || 0}`);
  const statusCounts = {};
  if (entries) {
    entries.forEach(e => {
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    });
    console.log('  Status breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });
  }

  // Check for FINAL STRIKE as competition type
  const { data: types, error: typeError } = await supabase
    .from('competition_types')
    .select('id, name, competition_format')
    .order('name');

  console.log(`\n✓ Competition Types: ${types?.length || 0}`);
  if (types) {
    types.forEach(t => {
      console.log(`  • ${t.name} (${t.competition_format})`);
    });
  }

  console.log('\n=== CHECK COMPLETE ===\n');
}

checkDatabase().catch(console.error);
