require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDates() {
  const eventId = '2c56a37a-5189-4fa8-8456-a871e5f2e9a3';
  
  // Get event round times
  const { data: event } = await supabase
    .from('clubhouse_events')
    .select('round2_tee_time, round3_tee_time, round4_tee_time')
    .eq('id', eventId)
    .single();
  
  console.log('Event round tee times:');
  console.log('  Round 2:', event.round2_tee_time);
  console.log('  Round 3:', event.round3_tee_time);
  console.log('  Round 4:', event.round4_tee_time);
  
  // Calculate close times (15 min before start)
  const r2close = new Date(new Date(event.round2_tee_time).getTime() - 15*60000).toISOString();
  const r3close = new Date(new Date(event.round3_tee_time).getTime() - 15*60000).toISOString();
  const r4close = new Date(new Date(event.round4_tee_time).getTime() - 15*60000).toISOString();
  
  // Update Round 2
  console.log('\nUpdating Round 2 competition...');
  const { error: e2 } = await supabase
    .from('clubhouse_competitions')
    .update({ 
      starts_at: event.round2_tee_time, 
      closes_at: r2close 
    })
    .match({ event_id: eventId, rounds_covered: '{2}' });
  if (e2) console.error('Error updating R2:', e2);
  else console.log('  ✓ Round 2 now closes:', r2close);
  
  // Update Round 3
  console.log('\nUpdating Round 3 competition...');
  const { error: e3 } = await supabase
    .from('clubhouse_competitions')
    .update({ 
      starts_at: event.round3_tee_time, 
      closes_at: r3close 
    })
    .match({ event_id: eventId, rounds_covered: '{3}' });
  if (e3) console.error('Error updating R3:', e3);
  else console.log('  ✓ Round 3 now closes:', r3close);
  
  // Update Round 4
  console.log('\nUpdating Round 4 competition...');
  const { error: e4 } = await supabase
    .from('clubhouse_competitions')
    .update({ 
      starts_at: event.round4_tee_time, 
      closes_at: r4close 
    })
    .match({ event_id: eventId, rounds_covered: '{4}' });
  if (e4) console.error('Error updating R4:', e4);
  else console.log('  ✓ Round 4 now closes:', r4close);
  
  // Verify
  console.log('\n📊 Final verification:');
  const { data: comps } = await supabase
    .from('clubhouse_competitions')
    .select('name, rounds_covered, closes_at')
    .eq('event_id', eventId)
    .order('rounds_covered');
  
  comps.forEach(c => {
    console.log(`  ${c.name}: ${c.closes_at}`);
  });
}

fixDates().then(() => process.exit(0)).catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
