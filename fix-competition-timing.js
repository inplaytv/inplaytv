require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixCompetitionTiming() {
  console.log('🔧 Fixing Competition Timing for All Events...\n');

  // Get all events with their round tee times
  const { data: events, error } = await supabase
    .from('clubhouse_events')
    .select('id, name, round1_tee_time, round2_tee_time, round3_tee_time, round4_tee_time, registration_opens_at');

  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  console.log(`Found ${events.length} events to fix\n`);

  for (const event of events) {
    console.log(`\n📅 Processing: ${event.name}`);
    console.log(`   Round 1: ${event.round1_tee_time}`);
    console.log(`   Round 2: ${event.round2_tee_time}`);
    console.log(`   Round 3: ${event.round3_tee_time}`);
    console.log(`   Round 4: ${event.round4_tee_time}`);

    // Get all competitions for this event
    const { data: competitions } = await supabase
      .from('clubhouse_competitions')
      .select('id, name, rounds_covered')
      .eq('event_id', event.id)
      .order('name');

    if (!competitions || competitions.length === 0) {
      console.log('   ⚠️  No competitions found');
      continue;
    }

    console.log(`   Found ${competitions.length} competitions\n`);

    // Map round numbers to tee times
    const roundTeeTimes = {
      1: event.round1_tee_time,
      2: event.round2_tee_time,
      3: event.round3_tee_time,
      4: event.round4_tee_time,
    };

    // Update each competition
    for (const comp of competitions) {
      const firstRound = comp.rounds_covered[0];
      const roundTeeTime = roundTeeTimes[firstRound];

      if (!roundTeeTime) {
        console.log(`   ⚠️  ${comp.name}: No tee time for round ${firstRound}`);
        continue;
      }

      // Calculate closes_at as 15 minutes before starts_at
      const startsAt = new Date(roundTeeTime);
      const closesAt = new Date(startsAt);
      closesAt.setMinutes(closesAt.getMinutes() - 15);

      console.log(`   🔧 ${comp.name}`);
      console.log(`      Rounds: [${comp.rounds_covered}]`);
      console.log(`      New starts_at: ${startsAt.toISOString()}`);
      console.log(`      New closes_at: ${closesAt.toISOString()}`);

      // Update competition
      const { error: updateError } = await supabase
        .from('clubhouse_competitions')
        .update({
          starts_at: startsAt.toISOString(),
          closes_at: closesAt.toISOString(),
          opens_at: event.registration_opens_at, // Ensure opens_at is consistent
        })
        .eq('id', comp.id);

      if (updateError) {
        console.log(`      ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`      ✅ Updated`);
      }
    }
  }

  console.log('\n\n🎉 All competitions fixed!');
  console.log('\nRun check-existing-events.js to verify the changes.');
}

fixCompetitionTiming().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
