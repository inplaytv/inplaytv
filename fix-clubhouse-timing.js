require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('\n========================================');
  console.log('   FIXING CLUBHOUSE COMPETITION TIMING');
  console.log('========================================\n');

  // Get all competitions with their event data
  const { data: comps, error } = await supabase
    .from('clubhouse_competitions')
    .select(`
      id,
      name,
      opens_at,
      closes_at,
      starts_at,
      event_id,
      clubhouse_events (
        start_date,
        registration_opens_at,
        registration_closes_at
      )
    `);

  if (error) {
    console.error('Error fetching competitions:', error);
    process.exit(1);
  }

  console.log(`Found ${comps.length} competitions\n`);

  let fixedCount = 0;

  for (const comp of comps) {
    const opensAt = new Date(comp.opens_at);
    const closesAt = new Date(comp.closes_at);
    const startsAt = comp.starts_at ? new Date(comp.starts_at) : null;
    
    const event = comp.clubhouse_events;
    const eventStart = new Date(event.start_date);

    // Check if timing is invalid
    const needsFix = !startsAt || closesAt >= opensAt === false || (startsAt && startsAt < closesAt);

    if (needsFix) {
      console.log(`❌ INVALID: ${comp.name}`);
      console.log(`   opens_at:  ${comp.opens_at}`);
      console.log(`   closes_at: ${comp.closes_at}`);
      console.log(`   starts_at: ${comp.starts_at || 'NULL'}`);
      
      // Fix: Set starts_at to event start_date
      const { error: updateError } = await supabase
        .from('clubhouse_competitions')
        .update({
          starts_at: event.start_date
        })
        .eq('id', comp.id);

      if (updateError) {
        console.error(`   ERROR fixing: ${updateError.message}`);
      } else {
        console.log(`   ✅ FIXED: Set starts_at to ${event.start_date}`);
        fixedCount++;
      }
      console.log();
    } else {
      console.log(`✓ OK: ${comp.name}`);
    }
  }

  console.log('\n========================================');
  console.log(`   FIXED ${fixedCount} of ${comps.length} competitions`);
  console.log('========================================\n');

  process.exit(0);
})();
