// Trigger a score update for the tournament
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/golf/.env.local' });

async function triggerScoreUpdate() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  const tournamentId = 'f091f409-8e88-437a-a97a-342b8f3c0ba0';
  
  console.log('\n🎯 Checking tournament details...\n');
  
  // Get tournament info
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();
  
  if (tournamentError) {
    console.error('❌ Error fetching tournament:', tournamentError);
    return;
  }
  
  console.log('Tournament:', tournament.name);
  console.log('Status:', tournament.status);
  console.log('DataGolf ID:', tournament.datagolf_id);
  console.log('Start Date:', tournament.start_date);
  console.log('End Date:', tournament.end_date);
  
  console.log('\n📊 Checking current scores...\n');
  
  // Check how many golfers have scores
  const { data: golfers, error: golfersError } = await supabase
    .from('tournament_golfers')
    .select('*')
    .eq('tournament_id', tournamentId);
  
  if (golfersError) {
    console.error('❌ Error fetching golfers:', golfersError);
    return;
  }
  
  console.log(`Total golfers in tournament: ${golfers.length}`);
  
  const withScores = golfers.filter(g => g.total_score !== null);
  const withR1 = golfers.filter(g => g.r1_score !== null);
  const withR2 = golfers.filter(g => g.r2_score !== null);
  
  console.log(`Golfers with total_score: ${withScores.length}`);
  console.log(`Golfers with r1_score: ${withR1.length}`);
  console.log(`Golfers with r2_score: ${withR2.length}`);
  
  if (withScores.length === 0) {
    console.log('\n⚠️  No scores found! The scoring service needs to run.');
    console.log('\nTo manually trigger scoring:');
    console.log('1. Check if scoring-service is running');
    console.log('2. Or call the DataGolf API endpoint directly');
    console.log(`3. Tournament DataGolf ID: ${tournament.datagolf_id}`);
  } else {
    console.log('\n✅ Scores are being populated!');
    console.log('\nSample golfer with scores:');
    const sample = withScores[0];
    console.log(JSON.stringify({
      name: sample.golfer_id,
      total: sample.total_score,
      toPar: sample.to_par,
      position: sample.position,
      r1: sample.r1_score,
      r2: sample.r2_score,
      r3: sample.r3_score,
      r4: sample.r4_score
    }, null, 2));
  }
}

triggerScoreUpdate().catch(console.error);
