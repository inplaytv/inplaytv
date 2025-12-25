/**
 * Setup Test Tournament with Golfers
 * 
 * This script helps you set up a complete test tournament with:
 * 1. Tournament with golfers assigned
 * 2. Golfer group with members
 * 3. Competition with assigned golfer group
 */

require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTestTournament() {
  console.log('🏌️ Setting up test tournament with golfers...\n');

  // Step 1: Get your test tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .eq('name', 'THE THANET OPEN')
    .single();

  if (!tournament) {
    console.error('❌ Tournament "THE THANET OPEN" not found');
    return;
  }

  console.log(`✅ Found tournament: ${tournament.name} (${tournament.slug})\n`);

  // Step 2: Get some real golfers from the database (first 20)
  const { data: golfers } = await supabase
    .from('golfers')
    .select('id, full_name, salary_pennies')
    .order('world_rank', { ascending: true, nullsFirst: false })
    .limit(20);

  console.log(`✅ Found ${golfers.length} golfers to use\n`);

  // Step 3: Assign golfers to tournament via tournament_golfers
  console.log('📝 Assigning golfers to tournament...');
  const tournamentGolfers = golfers.map(g => ({
    tournament_id: tournament.id,
    golfer_id: g.id,
    status: 'confirmed'
  }));

  const { error: tgError } = await supabase
    .from('tournament_golfers')
    .upsert(tournamentGolfers, { onConflict: 'tournament_id,golfer_id' });

  if (tgError) {
    console.error('❌ Error assigning golfers to tournament:', tgError.message);
  } else {
    console.log(`✅ Assigned ${golfers.length} golfers to tournament\n`);
  }

  // Step 4: Create/update golfer group
  const groupName = `${tournament.name} - Test Field`;
  
  const { data: existingGroup } = await supabase
    .from('golfer_groups')
    .select('id, name')
    .eq('name', groupName)
    .maybeSingle();

  let golferGroup;
  if (existingGroup) {
    golferGroup = existingGroup;
    console.log(`✅ Found existing golfer group: ${groupName}\n`);
  } else {
    const { data: newGroup, error: groupError } = await supabase
      .from('golfer_groups')
      .insert({ name: groupName })
      .select()
      .single();

    if (groupError) {
      console.error('❌ Error creating golfer group:', groupError.message);
      return;
    }
    golferGroup = newGroup;
    console.log(`✅ Created golfer group: ${groupName}\n`);
  }

  // Step 5: Add golfers to the group
  console.log('📝 Adding golfers to golfer group...');
  const groupMembers = golfers.map(g => ({
    group_id: golferGroup.id,
    golfer_id: g.id
  }));

  // Delete existing members first
  await supabase
    .from('golfer_group_members')
    .delete()
    .eq('group_id', golferGroup.id);

  const { error: gmError } = await supabase
    .from('golfer_group_members')
    .insert(groupMembers);

  if (gmError) {
    console.error('❌ Error adding golfers to group:', gmError.message);
  } else {
    console.log(`✅ Added ${golfers.length} golfers to group\n`);
  }

  // Step 6: Get competition type (you need at least one)
  const { data: compTypes } = await supabase
    .from('competition_types')
    .select('id, name')
    .limit(1);

  if (!compTypes || compTypes.length === 0) {
    console.error('❌ No competition types found. You need to create at least one competition type first.');
    console.log('   Run this SQL in Supabase:');
    console.log(`   INSERT INTO competition_types (name, description, num_golfers, scoring_type) VALUES ('Test Competition', 'Test', 6, 'stroke_play');`);
    return;
  }

  // Step 7: Create a competition for the tournament
  const { data: existingComp } = await supabase
    .from('tournament_competitions')
    .select('id, name')
    .eq('tournament_id', tournament.id)
    .maybeSingle();

  let competition;
  if (existingComp) {
    // Update existing competition with golfer group
    const { data: updated, error: updateError } = await supabase
      .from('tournament_competitions')
      .update({ assigned_golfer_group_id: golferGroup.id })
      .eq('id', existingComp.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating competition:', updateError.message);
      return;
    }
    competition = updated;
    console.log(`✅ Updated existing competition: ${competition.name}`);
  } else {
    // Create new competition
    const { data: newComp, error: compError } = await supabase
      .from('tournament_competitions')
      .insert({
        tournament_id: tournament.id,
        competition_type_id: compTypes[0].id,
        name: 'Test Full Course',
        entry_fee_pennies: 500,
        prize_pool_pennies: 10000,
        entrants_cap: 100,
        assigned_golfer_group_id: golferGroup.id
      })
      .select()
      .single();

    if (compError) {
      console.error('❌ Error creating competition:', compError.message);
      return;
    }
    competition = newComp;
    console.log(`✅ Created competition: ${competition.name}`);
  }

  console.log(`\n🎉 SETUP COMPLETE!\n`);
  console.log('='.repeat(60));
  console.log(`Tournament: ${tournament.name}`);
  console.log(`Slug: ${tournament.slug}`);
  console.log(`Golfers assigned: ${golfers.length}`);
  console.log(`Golfer group: ${golferGroup.name}`);
  console.log(`Competition: ${competition.name}`);
  console.log('='.repeat(60));
  console.log(`\n🌐 Test URL: http://localhost:3003/tournaments/${tournament.slug}\n`);
  console.log('Sample golfers in this tournament:');
  golfers.slice(0, 5).forEach((g, i) => {
    console.log(`  ${i + 1}. ${g.full_name} (£${(g.salary_pennies / 100).toFixed(2)})`);
  });
  console.log(`  ... and ${golfers.length - 5} more\n`);
}

setupTestTournament().catch(console.error);
