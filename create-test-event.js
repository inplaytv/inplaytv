require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestEvent() {
  console.log('🏌️ Creating Test Event...\n');

  // Setup dates
  const now = new Date('2026-01-05T12:00:00Z');
  
  // Registration opens: today at noon
  const regOpens = new Date(now);
  regOpens.setHours(12, 0, 0, 0);
  
  // Round 1 tee time: tomorrow at 8am
  const round1 = new Date(now);
  round1.setDate(round1.getDate() + 1);
  round1.setHours(8, 0, 0, 0);
  
  // Registration closes: 15 min before round 1
  const regCloses = new Date(round1);
  regCloses.setMinutes(regCloses.getMinutes() - 15);
  
  // Round 2: day after round 1 at 8am
  const round2 = new Date(round1);
  round2.setDate(round2.getDate() + 1);
  
  // Round 3: day after round 2 at 8am
  const round3 = new Date(round2);
  round3.setDate(round3.getDate() + 1);
  
  // Round 4: day after round 3 at 8am
  const round4 = new Date(round3);
  round4.setDate(round4.getDate() + 1);
  
  // End date: 6 hours after round 4 starts
  const endDate = new Date(round4);
  endDate.setHours(endDate.getHours() + 6);

  const eventData = {
    name: 'TEST EVENT - AUTO CREATED',
    slug: 'test-event-auto-' + Date.now(),
    description: 'Auto-generated test event to debug timing issues',
    location: 'Test Golf Club',
    status: 'draft',
    entry_credits: 100,
    max_entries: 50,
    start_date: round1.toISOString(),
    end_date: endDate.toISOString(),
    registration_opens_at: regOpens.toISOString(),
    registration_closes_at: regCloses.toISOString(),
    round1_tee_time: round1.toISOString(),
    round2_tee_time: round2.toISOString(),
    round3_tee_time: round3.toISOString(),
    round4_tee_time: round4.toISOString(),
    linked_tournament_id: null,
  };

  console.log('📅 Event Dates:');
  console.log('  Registration Opens:', eventData.registration_opens_at);
  console.log('  Registration Closes:', eventData.registration_closes_at);
  console.log('  Round 1 Tee Time:', eventData.round1_tee_time);
  console.log('  Round 2 Tee Time:', eventData.round2_tee_time);
  console.log('  Round 3 Tee Time:', eventData.round3_tee_time);
  console.log('  Round 4 Tee Time:', eventData.round4_tee_time);
  console.log('  Start Date (=Round 1):', eventData.start_date);
  console.log('  End Date:', eventData.end_date);
  console.log('');

  // Validate constraints manually
  const regOpensDate = new Date(eventData.registration_opens_at);
  const regClosesDate = new Date(eventData.registration_closes_at);
  const startDate = new Date(eventData.start_date);
  const endDateObj = new Date(eventData.end_date);

  console.log('✅ Constraint Checks:');
  console.log('  regCloses > regOpens?', regClosesDate > regOpensDate, `(${regClosesDate > regOpensDate ? 'PASS' : 'FAIL'})`);
  console.log('  startDate >= regCloses?', startDate >= regClosesDate, `(${startDate >= regClosesDate ? 'PASS' : 'FAIL'})`);
  console.log('  endDate > startDate?', endDateObj > startDate, `(${endDateObj > startDate ? 'PASS' : 'FAIL'})`);
  console.log('');

  // Insert event
  console.log('💾 Inserting event into database...');
  const { data: event, error: eventError } = await supabase
    .from('clubhouse_events')
    .insert(eventData)
    .select()
    .single();

  if (eventError) {
    console.error('❌ Failed to create event:', eventError);
    return;
  }

  console.log('✅ Event created successfully:', event.id);
  console.log('');

  // Now create 5 competitions for this event
  console.log('🏆 Creating 5 competitions...');
  
  const competitions = [
    {
      event_id: event.id,
      name: `${event.name} - All Four Rounds`,
      slug: event.slug + '-all-rounds',
      rounds_covered: [1, 2, 3, 4],
      entry_credits: event.entry_credits,
      max_entries: event.max_entries,
      opens_at: eventData.registration_opens_at,
      closes_at: regCloses.toISOString(),
      starts_at: round1.toISOString(),
      assigned_golfer_group_id: null,
    },
    {
      event_id: event.id,
      name: `${event.name} - Round 1`,
      slug: event.slug + '-round-1',
      rounds_covered: [1],
      entry_credits: event.entry_credits,
      max_entries: event.max_entries,
      opens_at: eventData.registration_opens_at,
      closes_at: regCloses.toISOString(),
      starts_at: round1.toISOString(),
      assigned_golfer_group_id: null,
    },
    {
      event_id: event.id,
      name: `${event.name} - Round 2`,
      slug: event.slug + '-round-2',
      rounds_covered: [2],
      entry_credits: event.entry_credits,
      max_entries: event.max_entries,
      opens_at: eventData.registration_opens_at,
      closes_at: new Date(round2.getTime() - 15 * 60 * 1000).toISOString(), // 15 min before round 2
      starts_at: round2.toISOString(),
      assigned_golfer_group_id: null,
    },
    {
      event_id: event.id,
      name: `${event.name} - Round 3`,
      slug: event.slug + '-round-3',
      rounds_covered: [3],
      entry_credits: event.entry_credits,
      max_entries: event.max_entries,
      opens_at: eventData.registration_opens_at,
      closes_at: new Date(round3.getTime() - 15 * 60 * 1000).toISOString(), // 15 min before round 3
      starts_at: round3.toISOString(),
      assigned_golfer_group_id: null,
    },
    {
      event_id: event.id,
      name: `${event.name} - Round 4`,
      slug: event.slug + '-round-4',
      rounds_covered: [4],
      entry_credits: event.entry_credits,
      max_entries: event.max_entries,
      opens_at: eventData.registration_opens_at,
      closes_at: new Date(round4.getTime() - 15 * 60 * 1000).toISOString(), // 15 min before round 4
      starts_at: round4.toISOString(),
      assigned_golfer_group_id: null,
    },
  ];

  for (const comp of competitions) {
    console.log(`  Creating: ${comp.name}`);
    console.log(`    Opens: ${comp.opens_at}`);
    console.log(`    Closes: ${comp.closes_at}`);
    console.log(`    Starts: ${comp.starts_at}`);
    
    const { error: compError } = await supabase
      .from('clubhouse_competitions')
      .insert(comp);

    if (compError) {
      console.error(`    ❌ Failed:`, compError.message);
    } else {
      console.log(`    ✅ Created`);
    }
  }

  console.log('\n🎉 Test event created successfully!');
  console.log(`   Event ID: ${event.id}`);
  console.log(`   View at: http://localhost:3002/clubhouse/events/${event.id}/edit`);
  console.log(`\n🔍 Now update this event and watch the terminal logs...`);
}

createTestEvent().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
