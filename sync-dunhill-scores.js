// Update tournament with DataGolf sync and populate scores
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

const DATAGOLF_API_KEY = 'ac7793fb5f617626ccc418008832';

async function syncTournamentScores() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tournamentId = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';
  
  console.log('\n🔍 Fetching live scores from DataGolf...\n');
  
  // Fetch live scores for euro tour
  const response = await fetch(`https://feeds.datagolf.com/preds/in-play?tour=euro&key=${DATAGOLF_API_KEY}`);
  const liveData = await response.json();
  
  if (!liveData || !liveData.data) {
    console.error('❌ No live data found');
    return;
  }
  
  console.log(`✅ Found event: ${liveData.info.event_name}`);
  console.log(`Current round: ${liveData.info.current_round}`);
  console.log(`Last update: ${liveData.info.last_update}`);
  console.log(`Players with scores: ${liveData.data.length}\n`);
  
  // Get all tournament golfers
  const { data: tournamentGolfers, error: golfersError } = await supabase
    .from('tournament_golfers')
    .select('id, golfer_id, golfers!inner(dg_id)')
    .eq('tournament_id', tournamentId);
  
  if (golfersError) {
    console.error('❌ Error fetching tournament golfers:', golfersError);
    return;
  }
  
  console.log(`📊 Processing ${tournamentGolfers.length} tournament golfers...\n`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const tg of tournamentGolfers) {
    // Find the golfer in DataGolf response by dg_id
    const dgScore = liveData.data.find(p => p.dg_id === tg.golfers.dg_id);
    
    if (!dgScore) {
      notFound++;
      continue;
    }
    
    // Update the tournament_golfers record with scores
    const { error: updateError } = await supabase
      .from('tournament_golfers')
      .update({
        r1_score: dgScore.R1 || null,
        r2_score: dgScore.R2 || null,
        r3_score: dgScore.R3 || null,
        r4_score: dgScore.R4 || null,
        total_score: dgScore.current_score,
        position: dgScore.current_pos,
        to_par: dgScore.current_score, // Store as integer
        status: dgScore.status || 'active'
      })
      .eq('id', tg.id);
    
    if (updateError) {
      console.error(`Error updating ${tg.golfer_id}:`, updateError);
    } else {
      updated++;
      if (updated <= 5) {
        console.log(`✅ Updated: ${dgScore.player_name} - R1: ${dgScore.R1}, R2: ${dgScore.R2}, Total: ${dgScore.current_score}`);
      }
    }
  }
  
  console.log(`\n📊 Update Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Not found in DataGolf: ${notFound}`);
  console.log(`   Total: ${tournamentGolfers.length}`);
  
  console.log('\n✅ Score sync complete!');
  console.log('   Refresh your browser to see the updated scores');
}

syncTournamentScores().catch(console.error);
