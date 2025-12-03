const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';
const apiKey = 'ac7793fb5f617626ccc418008832';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllGolferRankings() {
  console.log('🏆 Updating World Rankings for All Golfers\n');

  // Fetch rankings from DataGolf
  console.log('📊 Fetching rankings from DataGolf...');
  const response = await fetch(
    `https://feeds.datagolf.com/preds/get-dg-rankings?file_format=json&key=${apiKey}`
  );
  const data = await response.json();
  console.log(`✅ Loaded ${data.rankings.length} players from DataGolf\n`);

  // Create map of dg_id -> owgr_rank
  const rankingsMap = new Map();
  data.rankings.forEach(player => {
    rankingsMap.set(player.dg_id, player.owgr_rank);
  });

  // Get all golfers from database
  console.log('📋 Fetching golfers from database...');
  const { data: golfers, error } = await supabase
    .from('golfers')
    .select('id, dg_id, name, world_rank')
    .not('dg_id', 'is', null);

  if (error) {
    console.error('❌ Error fetching golfers:', error);
    return;
  }

  console.log(`✅ Found ${golfers.length} golfers with dg_id\n`);

  // Update rankings
  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const golfer of golfers) {
    const newRank = rankingsMap.get(golfer.dg_id);
    
    if (newRank === undefined) {
      notFound++;
      continue;
    }

    if (newRank === golfer.world_rank) {
      skipped++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('golfers')
      .update({ world_rank: newRank })
      .eq('id', golfer.id);

    if (updateError) {
      console.error(`❌ Error updating ${golfer.name}:`, updateError);
    } else {
      updated++;
      if (updated <= 10) {
        console.log(`✅ ${golfer.name}: ${golfer.world_rank || 'null'} → ${newRank}`);
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated} golfers`);
  console.log(`   Skipped (no change): ${skipped} golfers`);
  console.log(`   Not found in DataGolf: ${notFound} golfers`);
}

updateAllGolferRankings();
