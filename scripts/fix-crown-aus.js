require('dotenv').config({ path: require('path').join(__dirname, '..', 'apps', 'admin', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING CROWN AUSTRALIAN OPEN DATES ===\n');
  
  // Current corrupted data
  const { data: before } = await client
    .from('tournaments')
    .select('name, round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('BEFORE:');
  console.log(JSON.stringify(before, null, 2));
  
  // Fix the dates (based on start_date being Dec 4-7, 2025)
  const { error: updateErr } = await client
    .from('tournaments')
    .update({
      round_1_start: '2025-12-04T00:00:00+00:00',  // Fix from 22025
      round_3_start: '2025-12-06T00:00:00+00:00',  // Fix from 0025-02-06
      updated_at: new Date().toISOString()
    })
    .eq('slug', 'crown-australian-open');
  
  if (updateErr) {
    console.error('❌ Error updating:', updateErr);
    return;
  }
  
  const { data: after } = await client
    .from('tournaments')
    .select('name, round_1_start, round_2_start, round_3_start, round_4_start')
    .eq('slug', 'crown-australian-open')
    .single();
  
  console.log('\nAFTER:');
  console.log(JSON.stringify(after, null, 2));
  console.log('\n✅ Crown Australian Open dates fixed!');
  
  // Now re-run the competition registration time fix for this tournament
  const { data: comps } = await client
    .from('tournament_competitions')
    .select(`
      id,
      reg_close_at,
      tournament_id,
      competition_types (name, slug)
    `)
    .eq('tournament_id', (await client.from('tournaments').select('id').eq('slug', 'crown-australian-open').single()).data.id);
  
  console.log('\n=== FIXING COMPETITION REG TIMES ===\n');
  
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
