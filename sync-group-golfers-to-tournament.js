require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncGolfersToTournament(tournamentSlug) {
  console.log(`\n🔄 Syncing golfers for tournament: ${tournamentSlug}`);
  console.log('='.repeat(60));
  
  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('slug', tournamentSlug)
    .single();
  
  if (!tournament) {
    console.log('❌ Tournament not found!');
    return;
  }
  
  console.log(`✅ Found tournament: ${tournament.name} (${tournament.id})`);
  
  // Get assigned golfer groups
  const { data: assignedGroups } = await supabase
    .from('tournament_golfer_groups')
    .select('group_id, golfer_groups(name)')
    .eq('tournament_id', tournament.id);
  
  if (!assignedGroups || assignedGroups.length === 0) {
    console.log('❌ No golfer groups assigned to this tournament!');
    console.log('💡 Assign a golfer group first in the admin panel.');
    return;
  }
  
  console.log(`\n📋 Assigned Groups (${assignedGroups.length}):`);
  assignedGroups.forEach(g => console.log(`  - ${g.golfer_groups.name}`));
  
  // Get all golfers from these groups
  let allGolferIds = new Set();
  for (const group of assignedGroups) {
    const { data: members } = await supabase
      .from('golfer_group_members')
      .select('golfer_id')
      .eq('group_id', group.group_id);
    
    members?.forEach(m => allGolferIds.add(m.golfer_id));
  }
  
  console.log(`\n🏌️ Total unique golfers in groups: ${allGolferIds.size}`);
  
  // Check existing tournament golfers
  const { data: existingGolfers } = await supabase
    .from('tournament_golfers')
    .select('golfer_id')
    .eq('tournament_id', tournament.id);
  
  const existingIds = new Set(existingGolfers?.map(g => g.golfer_id) || []);
  console.log(`📊 Already in tournament_golfers: ${existingIds.size}`);
  
  // Find golfers to add
  const golfersToAdd = Array.from(allGolferIds).filter(id => !existingIds.has(id));
  
  if (golfersToAdd.length === 0) {
    console.log('\n✅ All golfers already added! No sync needed.');
    return;
  }
  
  console.log(`\n➕ Adding ${golfersToAdd.length} new golfers...`);
  
  // Insert golfers in batches
  const batchSize = 100;
  let addedCount = 0;
  
  for (let i = 0; i < golfersToAdd.length; i += batchSize) {
    const batch = golfersToAdd.slice(i, i + batchSize);
    const records = batch.map(golferId => ({
      tournament_id: tournament.id,
      golfer_id: golferId,
      status: 'confirmed'
    }));
    
    const { error } = await supabase
      .from('tournament_golfers')
      .insert(records);
    
    if (error) {
      console.log(`❌ Error inserting batch: ${error.message}`);
    } else {
      addedCount += batch.length;
      console.log(`  ✓ Added ${addedCount} / ${golfersToAdd.length}`);
    }
  }
  
  console.log(`\n🎉 SUCCESS! Added ${addedCount} golfers to tournament.`);
  console.log(`\n💡 Now when you go to "Build a Team", you should see these golfers.`);
}

// Get tournament slug from command line
const tournamentSlug = process.argv[2];

if (!tournamentSlug) {
  console.log('\n❌ Usage: node sync-group-golfers-to-tournament.js <tournament-slug>');
  console.log('\nExample:');
  console.log('  node sync-group-golfers-to-tournament.js the-greenidge-open');
  console.log('  node sync-group-golfers-to-tournament.js the-thanet-open');
  process.exit(1);
}

syncGolfersToTournament(tournamentSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
