const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCrownRankings() {
  console.log('\n📊 Updating world rankings for Crown Australian Open golfers...\n');
  
  // Get tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .ilike('name', '%Crown Australian Open%')
    .single();
  
  if (!tournament) {
    console.error('❌ Tournament not found');
    return;
  }
  
  // Get all golfers for this tournament
  const { data: tournamentGolfers } = await supabase
    .from('tournament_golfers')
    .select(`
      golfer_id,
      golfers (
        id,
        name,
        dg_id,
        world_rank
      )
    `)
    .eq('tournament_id', tournament.id);
  
  if (!tournamentGolfers || tournamentGolfers.length === 0) {
    console.log('No golfers found for tournament');
    return;
  }
  
  console.log(`Found ${tournamentGolfers.length} golfers in tournament\n`);
  
  // Fetch rankings from DataGolf
  console.log('📡 Fetching world rankings from DataGolf...');
  const apiKey = process.env.DATAGOLF_API_KEY || 'b1cc578cbf27ed0d4879c6bea820';
  
  const response = await fetch(
    `https://feeds.datagolf.com/get-dg-rankings?file_format=json&key=${apiKey}`
  );
  
  if (!response.ok) {
    console.error('❌ Failed to fetch rankings from DataGolf');
    return;
  }
  
  const rankingsData = await response.json();
  console.log(`✅ Loaded ${rankingsData.rankings.length} players from DataGolf\n`);
  
  // Create map: player name → OWGR
  const rankingsMap = new Map();
  for (const player of rankingsData.rankings) {
    // DataGolf format: "Last, First"
    rankingsMap.set(player.player_name, player.owgr_rank);
    rankingsMap.set(player.dg_id, player.owgr_rank); // Also map by dg_id
  }
  
  let updated = 0;
  let notFound = 0;
  let alreadyHasRank = 0;
  
  for (const tg of tournamentGolfers) {
    const golfer = tg.golfers;
    
    if (!golfer) continue;
    
    // Check if golfer already has ranking
    if (golfer.world_rank !== null) {
      alreadyHasRank++;
      continue;
    }
    
    // Try to find ranking by dg_id first
    let owgr = null;
    if (golfer.dg_id) {
      owgr = rankingsMap.get(golfer.dg_id);
    }
    
    // If not found, try by name
    if (!owgr) {
      owgr = rankingsMap.get(golfer.name);
    }
    
    if (owgr) {
      // Update golfer with ranking
      const { error } = await supabase
        .from('golfers')
        .update({ world_rank: owgr })
        .eq('id', golfer.id);
      
      if (!error) {
        console.log(`✅ ${golfer.name}: OWGR ${owgr}`);
        updated++;
      }
    } else {
      console.log(`⚠️  ${golfer.name}: Not found in DataGolf rankings`);
      notFound++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated with rankings: ${updated}`);
  console.log(`   Already had ranking: ${alreadyHasRank}`);
  console.log(`   Not found in DataGolf: ${notFound}`);
  console.log(`\n✅ Done!\n`);
}

updateCrownRankings();
