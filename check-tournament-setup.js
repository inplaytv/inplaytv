require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .in('slug', ['the-thanet-open', 'the-greenidge-open']);

  console.log('\n📋 Tournaments:');
  tournaments.forEach(t => console.log(`  ${t.name} (${t.slug}): ${t.id}`));

  for (const t of tournaments) {
    console.log(`\n\n🏌️ ${t.name}:`);
    console.log('='.repeat(60));
    
    // Check tournament_golfers
    const { data: tg } = await supabase
      .from('tournament_golfers')
      .select('*')
      .eq('tournament_id', t.id);
    console.log(`\n1️⃣ Tournament Golfers in tournament_golfers table: ${tg?.length || 0}`);
    
    // Check assigned groups
    const { data: groups } = await supabase
      .from('tournament_golfer_groups')
      .select('group_id, golfer_groups(name)')
      .eq('tournament_id', t.id);
    console.log(`\n2️⃣ Assigned Golfer Groups: ${groups?.length || 0}`);
    groups?.forEach(g => {
      console.log(`  - ${g.golfer_groups.name} (${g.group_id})`);
    });
    
    // Check group members
    if (groups?.length > 0) {
      for (const group of groups) {
        const { data: members } = await supabase
          .from('golfer_group_members')
          .select('golfer_id, golfers(full_name)')
          .eq('group_id', group.group_id);
        console.log(`\n3️⃣ Members in "${group.golfer_groups.name}": ${members?.length || 0}`);
        members?.slice(0, 5).forEach(m => {
          console.log(`  - ${m.golfers.full_name}`);
        });
        if (members?.length > 5) {
          console.log(`  ... and ${members.length - 5} more`);
        }
      }
    }
    
    // Check competitions
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('id, name, assigned_golfer_group_id')
      .eq('tournament_id', t.id);
    console.log(`\n4️⃣ Competitions: ${comps?.length || 0}`);
    comps?.forEach(c => {
      console.log(`  - ${c.name} (${c.id})`);
      console.log(`    → Assigned Group ID: ${c.assigned_golfer_group_id || 'NONE'}`);
    });
    
    // Diagnosis
    console.log(`\n🔍 DIAGNOSIS:`);
    if (!tg || tg.length === 0) {
      console.log(`  ❌ Problem: No golfers in tournament_golfers table!`);
      console.log(`  💡 Solution: You need to add golfers to the tournament.`);
      console.log(`     In admin, go to tournament management and add golfers.`);
    } else {
      console.log(`  ✅ ${tg.length} golfers are in tournament_golfers table`);
    }
    
    if (comps && comps[0]?.assigned_golfer_group_id) {
      console.log(`  ℹ️ Competition uses golfer group filtering`);
      if (groups && groups.length > 0) {
        console.log(`  ✅ Golfer group is assigned to tournament`);
      } else {
        console.log(`  ⚠️ Competition references group but it's not assigned to tournament!`);
      }
    } else {
      console.log(`  ℹ️ Competition shows all tournament golfers (no group filter)`);
    }
  }
}

main().catch(console.error);
