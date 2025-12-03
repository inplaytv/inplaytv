const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'golf', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLeaderboardData() {
  console.log('🔍 Checking what the leaderboard API would return...\n');

  const tournaments = [
    { name: 'Hero World Challenge', id: '' },
    { name: 'Nedbank Golf Challenge', id: '88fbe29c-83c0-4be9-b03b-897d3fb2209f' },
    { name: 'Crown Australian Open', id: 'f587d8e4-eef0-42c9-b008-6ffbd54e4e67' }
  ];

  for (const tournament of tournaments) {
    if (!tournament.id) {
      // Find Hero by name
      const { data } = await supabase
        .from('tournaments')
        .select('id')
        .ilike('name', '%hero%')
        .single();
      if (data) tournament.id = data.id;
    }

    console.log(`\n=== ${tournament.name} ===`);
    console.log(`ID: ${tournament.id}`);

    // Simulate what the leaderboard API does
    const { data: golfers, error } = await supabase
      .from('tournament_golfers')
      .select(`
        golfer_id,
        r1_score,
        r2_score,
        r3_score,
        r4_score,
        total_score,
        position,
        golfers (
          id,
          first_name,
          last_name,
          name,
          country
        )
      `)
      .eq('tournament_id', tournament.id)
      .order('total_score', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('❌ Error:', error);
      continue;
    }

    console.log(`Found ${golfers?.length || 0} golfers`);
    
    if (golfers && golfers.length > 0) {
      console.log('\nFirst 3 golfers:');
      golfers.slice(0, 3).forEach((tg, i) => {
        const golfer = tg.golfers;
        console.log(`  ${i + 1}. ${golfer?.name || 'Unknown'} - Total: ${tg.total_score || 'N/A'}`);
      });
    } else {
      console.log('⚠️  No golfers found in tournament_golfers for this tournament!');
    }
  }

  // Now check what competitions point to these tournaments
  console.log('\n\n=== COMPETITIONS ===');
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      name,
      tournament_id,
      tournaments (
        name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  for (const comp of competitions || []) {
    console.log(`\n📊 ${comp.name}`);
    console.log(`   Linked to Tournament: ${comp.tournaments?.name || 'Unknown'}`);
    console.log(`   Tournament ID: ${comp.tournament_id}`);
    
    const { count } = await supabase
      .from('tournament_golfers')
      .select('golfer_id', { count: 'exact', head: true })
      .eq('tournament_id', comp.tournament_id);
    
    console.log(`   Golfers available: ${count || 0} ${count === 0 ? '❌' : '✅'}`);
  }
}

checkLeaderboardData().catch(console.error);
