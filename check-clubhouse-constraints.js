require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkConstraints() {
  console.log('🔍 Checking Clubhouse Data...\n');

  console.log('🔍 Checking Current Competition Timing...\n');

  // Check competition timing
  const { data: comps, error: e2 } = await supabase
    .from('clubhouse_competitions')
    .select('id, name, opens_at, closes_at, starts_at, rounds_covered')
    .eq('event_id', 'c11eefdc-4c3b-47de-ba13-8ebe2e07c62b')
    .order('name');

  if (e2) {
    console.log('Competition check failed:', e2);
  } else {
    console.log('📊 St Augustings Golf Club - Competitions:');
    comps?.forEach(c => {
      console.log(`\n  ${c.name} (rounds: ${JSON.stringify(c.rounds_covered)})`);
      console.log(`    opens_at:  ${c.opens_at}`);
      console.log(`    closes_at: ${c.closes_at}`);
      console.log(`    starts_at: ${c.starts_at}`);
      
      // Check if timing is valid
      const opens = new Date(c.opens_at);
      const closes = new Date(c.closes_at);
      const starts = new Date(c.starts_at);
      
      const valid = closes > opens && starts >= closes;
      console.log(`    ✓ Valid: ${valid}`);
      if (!valid) {
        if (closes <= opens) console.log(`      ❌ closes_at (${c.closes_at}) <= opens_at (${c.opens_at})`);
        if (starts < closes) console.log(`      ❌ starts_at (${c.starts_at}) < closes_at (${c.closes_at})`);
      }
    });
  }

  // Check event data
  console.log('\n🔍 Checking Event Data...\n');
  const { data: event, error: e3 } = await supabase
    .from('clubhouse_events')
    .select('*')
    .eq('id', 'c11eefdc-4c3b-47de-ba13-8ebe2e07c62b')
    .single();

  if (e3) {
    console.log('Event check failed:', e3);
  } else {
    console.log('📅 Event: ' + event.name);
    console.log(`  start_date: ${event.start_date}`);
    console.log(`  end_date: ${event.end_date}`);
    console.log(`  registration_opens_at: ${event.registration_opens_at}`);
    console.log(`  registration_closes_at: ${event.registration_closes_at}`);
    console.log(`  round1_tee_time: ${event.round1_tee_time}`);
    console.log(`  round2_tee_time: ${event.round2_tee_time}`);
    console.log(`  round3_tee_time: ${event.round3_tee_time}`);
    console.log(`  round4_tee_time: ${event.round4_tee_time}`);
  }
}

checkConstraints().then(() => process.exit(0));
