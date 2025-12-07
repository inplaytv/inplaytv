require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING CROWN AUSTRALIAN OPEN TIMEZONE ===\n');
  
  // Crown Australian Open is in Australia/Sydney (UTC+11 during summer AEDT)
  // Current DB times are local times stored as UTC - need to subtract 11 hours
  
  const { data: before } = await client
    .from('tournaments')
    .select('name, round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('BEFORE (times are LOCAL stored as UTC):');
  console.log(JSON.stringify(before, null, 2));
  
  // Convert each round time from local to UTC by subtracting 11 hours
  const fixTime = (localTimeStr) => {
    if (!localTimeStr) return null;
    const localAsUTC = new Date(localTimeStr);
    const correctUTC = new Date(localAsUTC.getTime() - (11 * 60 * 60 * 1000));
    return correctUTC.toISOString();
  };
  
  const updates = {
    round_1_start: fixTime(before.round_1_start),
    round_2_start: fixTime(before.round_2_start),
    round_3_start: fixTime(before.round_3_start),
    round_4_start: fixTime(before.round_4_start),
    updated_at: new Date().toISOString()
  };
  
  console.log('\nAFTER (correct UTC times):');
  console.log(JSON.stringify(updates, null, 2));
  
  const { error } = await client
    .from('tournaments')
    .update(updates)
    .eq('slug', 'crown-australian-open');
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log('\n✅ Crown Australian Open timezone fixed!');
  
  // Verify
  const { data: after } = await client
    .from('tournaments')
    .select('name, round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('\nVERIFICATION:');
  const now = new Date();
  const r4 = new Date(after.round_4_start);
  const hoursUntil = (r4 - now) / 1000 / 60 / 60;
  console.log('Round 4:', after.round_4_start);
  console.log('Current:', now.toISOString());
  console.log('Hours until R4 tee:', hoursUntil.toFixed(2));
  console.log(hoursUntil >= 3 && hoursUntil <= 4 ? '✅ CORRECT!' : '❌ Still wrong');
  
  // Now fix competition registration times
  console.log('\n=== FIXING COMPETITION REG TIMES ===');
  
  const { data: comps } = await client
    .from('tournament_competitions')
    .select(`
      id,
      tournament_id,
      competition_types (name, slug)
    `)
    .eq('tournament_id', (await client.from('tournaments').select('id').eq('slug', 'crown-australian-open').single()).data.id);
  
  for (const comp of comps) {
    let newRegClose = null;
    
    switch (comp.competition_types.slug) {
      case 'final-strike':
        newRegClose = new Date(new Date(after.round_4_start).getTime() - 15 * 60 * 1000);
        break;
      case 'first-to-strike':
      case 'beat-the-cut':
      case 'full-course':
        newRegClose = new Date(new Date(after.round_1_start).getTime() - 15 * 60 * 1000);
        break;
      case 'the-weekender':
        newRegClose = new Date(new Date(after.round_3_start).getTime() - 15 * 60 * 1000);
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
  
  console.log('\n✅ All Crown Australian Open times fixed!');
})().catch(console.error);
