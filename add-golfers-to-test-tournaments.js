require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addGolfersToTestTournaments() {
  console.log('🏌️ Adding golfers to test tournaments...\n');

  // Get the Nedbank golfer group
  const { data: group } = await supabase
    .from('golfer_groups')
    .select('id, name')
    .ilike('name', '%nedbank%')
    .single();

  if (!group) {
    console.error('❌ Nedbank golfer group not found');
    return;
  }

  console.log(`✅ Found golfer group: ${group.name}`);

  // Get golfers in the group
  const { data: groupMembers } = await supabase
    .from('golfer_group_members')
    .select('golfer_id')
    .eq('group_id', group.id);

  console.log(`✅ Found ${groupMembers.length} golfers in group\n`);

  // Get test tournaments
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name')
    .or('name.ilike.%thanet%,name.ilike.%greenidge%');

  console.log(`📋 Test tournaments found:`);
  tournaments.forEach(t => console.log(`   - ${t.name} (${t.id})`));
  console.log('');

  // Add golfers to each tournament
  for (const tournament of tournaments) {
    console.log(`\n🎯 Adding golfers to ${tournament.name}...`);

    // Check existing golfers
    const { data: existing } = await supabase
      .from('tournament_golfers')
      .select('golfer_id')
      .eq('tournament_id', tournament.id);

    console.log(`   Current golfers: ${existing.length}`);

    // Prepare inserts (skip duplicates)
    const existingIds = new Set(existing.map(e => e.golfer_id));
    const newGolfers = groupMembers
      .filter(m => !existingIds.has(m.golfer_id))
      .map(m => ({
        tournament_id: tournament.id,
        golfer_id: m.golfer_id,
        status: 'confirmed'
      }));

    if (newGolfers.length === 0) {
      console.log(`   ✅ Already has all ${existing.length} golfers`);
      continue;
    }

    // Insert new golfers
    const { error } = await supabase
      .from('tournament_golfers')
      .insert(newGolfers);

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Added ${newGolfers.length} golfers (total now: ${existing.length + newGolfers.length})`);
    }
  }

  console.log('\n✅ Done!');
}

addGolfersToTestTournaments().catch(console.error);
