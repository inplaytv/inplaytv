require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING NEDBANK GOLF CHALLENGE ===\n');
  
  // Tournament is in Sun City, South Africa (UTC+2)
  // Current timezone in DB is wrong (America/Los_Angeles)
  // Times are local times stored as UTC - need to subtract 2 hours
  
  const { data: before } = await client
    .from('tournaments')
    .select('name, timezone, round_1_start, round_2_start, round_3_start, round_4_start, location')
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .single();
  
  console.log('BEFORE:');
  console.log('Location:', before.location);
  console.log('Timezone (WRONG):', before.timezone);
  console.log('Round times (local stored as UTC):', JSON.stringify({
    round_1: before.round_1_start,
    round_2: before.round_2_start,
    round_3: before.round_3_start,
    round_4: before.round_4_start
  }, null, 2));
  
  // Convert from local South Africa time to UTC by subtracting 2 hours
  const fixTime = (localTimeStr) => {
    if (!localTimeStr) return null;
    const localAsUTC = new Date(localTimeStr);
    const correctUTC = new Date(localAsUTC.getTime() - (2 * 60 * 60 * 1000));
    return correctUTC.toISOString();
  };
  
  const updates = {
    timezone: 'Africa/Johannesburg',  // Correct timezone for South Africa
    round_1_start: fixTime(before.round_1_start),
    round_2_start: fixTime(before.round_2_start),
    round_3_start: fixTime(before.round_3_start),
    round_4_start: fixTime(before.round_4_start),
    updated_at: new Date().toISOString()
  };
  
  console.log('\nAFTER (correct UTC times):');
  console.log('Timezone (CORRECT):', updates.timezone);
  console.log(JSON.stringify({
    round_1: updates.round_1_start,
    round_2: updates.round_2_start,
    round_3: updates.round_3_start,
    round_4: updates.round_4_start
  }, null, 2));
  
  const { error } = await client
    .from('tournaments')
    .update(updates)
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('\n✅ Nedbank timezone and times fixed!');
  
  // Verify
  const { data: after } = await client
    .from('tournaments')
    .select('timezone, round_4_start')
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .single();
  
  const now = new Date();
  const r4 = new Date(after.round_4_start);
  const hoursUntil = (r4 - now) / 1000 / 60 / 60;
  
  console.log('\nVERIFICATION:');
  console.log('Timezone:', after.timezone);
  console.log('Round 4:', after.round_4_start);
  console.log('Current:', now.toISOString());
  console.log('Hours until R4:', hoursUntil.toFixed(2));
  
  // Now fix competition registration times
  console.log('\n=== FIXING COMPETITION REG TIMES ===');
  
  const { data: tournament } = await client
    .from('tournaments')
    .select('id, round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'nedbank-golf-challenge-in-honour-of-gary-player')
    .single();
  
  const { data: comps } = await client
    .from('tournament_competitions')
    .select(`
      id,
      competition_types (name, slug)
    `)
    .eq('tournament_id', tournament.id);
  
  for (const comp of comps) {
    let newRegClose = null;
    
    switch (comp.competition_types.slug) {
      case 'final-strike':
        newRegClose = new Date(new Date(tournament.round_4_start).getTime() - 15 * 60 * 1000);
        break;
      case 'first-to-strike':
      case 'beat-the-cut':
      case 'full-course':
        newRegClose = new Date(new Date(tournament.round_1_start).getTime() - 15 * 60 * 1000);
        break;
      case 'the-weekender':
        newRegClose = new Date(new Date(tournament.round_3_start).getTime() - 15 * 60 * 1000);
        break;
    }
    
    if (newRegClose) {
      await client
        .from('tournament_competitions')
        .update({
          reg_close_at: newRegClose.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', comp.id);
      
      console.log(`✅ ${comp.competition_types.name}: ${newRegClose.toISOString()}`);
    }
  }
  
  console.log('\n✅ All Nedbank times fixed!');
})().catch(console.error);
