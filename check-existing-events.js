require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingEvents() {
  console.log('🔍 Checking ALL Existing Clubhouse Events...\n');

  // Get all events
  const { data: events, error } = await supabase
    .from('clubhouse_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  console.log(`Found ${events.length} events:\n`);

  events.forEach((event, idx) => {
    console.log(`\n${idx + 1}. ${event.name} (${event.id})`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Created: ${event.created_at}`);
    console.log(`   Registration Opens: ${event.registration_opens_at}`);
    console.log(`   Registration Closes: ${event.registration_closes_at}`);
    console.log(`   Start Date: ${event.start_date}`);
    console.log(`   End Date: ${event.end_date}`);
    console.log(`   Round 1: ${event.round1_tee_time}`);
    console.log(`   Round 2: ${event.round2_tee_time}`);
    console.log(`   Round 3: ${event.round3_tee_time}`);
    console.log(`   Round 4: ${event.round4_tee_time}`);
    
    // Check if dates are valid
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const regOpens = new Date(event.registration_opens_at);
    const regCloses = new Date(event.registration_closes_at);
    const round1 = new Date(event.round1_tee_time);
    
    console.log(`   Validation:`);
    console.log(`     regCloses > regOpens? ${regCloses > regOpens ? '✅' : '❌'}`);
    console.log(`     startDate >= regCloses? ${startDate >= regCloses ? '✅' : '❌'}`);
    console.log(`     endDate > startDate? ${endDate > startDate ? '✅' : '❌'}`);
    console.log(`     startDate matches round1? ${startDate.getTime() === round1.getTime() ? '✅' : '❌'}`);
  });

  // Get columns from first event
  if (events.length > 0) {
    console.log('\n\n📋 Event Table Columns:');
    console.log(Object.keys(events[0]).join(', '));
  }

  // Check specific problematic event
  console.log('\n\n🔍 Checking Specific Event: St Augustings Golf Club');
  const { data: specific, error: err } = await supabase
    .from('clubhouse_events')
    .select('*')
    .eq('id', 'c11eefdc-4c3b-47de-ba13-8ebe2e07c62b')
    .single();

  if (specific) {
    console.log('\nCurrent Database Values:');
    console.log(`  name: ${specific.name}`);
    console.log(`  start_date: ${specific.start_date}`);
    console.log(`  end_date: ${specific.end_date}`);
    console.log(`  round1_tee_time: ${specific.round1_tee_time}`);
    console.log(`  round2_tee_time: ${specific.round2_tee_time}`);
    console.log(`  round3_tee_time: ${specific.round3_tee_time}`);
    console.log(`  round4_tee_time: ${specific.round4_tee_time}`);
    
    // Check competitions for this event
    const { data: comps } = await supabase
      .from('clubhouse_competitions')
      .select('name, rounds_covered, opens_at, closes_at, starts_at')
      .eq('event_id', specific.id)
      .order('name');
    
    console.log('\n  Competitions:');
    comps?.forEach(c => {
      console.log(`\n    ${c.name}`);
      console.log(`      Rounds: [${c.rounds_covered}]`);
      console.log(`      Opens: ${c.opens_at}`);
      console.log(`      Closes: ${c.closes_at}`);
      console.log(`      Starts: ${c.starts_at}`);
    });
  }
}

checkExistingEvents().then(() => process.exit(0));
