require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== THE NORTHFORLAND OPEN (CLUBHOUSE SYSTEM) ===\n');
  console.log('Current Time:', new Date().toISOString(), '\n');

  // 1. Get THE NORTHFORLAND OPEN from CLUBHOUSE system
  console.log('1. Checking Clubhouse Event:');
  console.log('   System: CLUBHOUSE');
  console.log('   Table: clubhouse_events');
  console.log('');

  const { data: event, error: eventError } = await supabase
    .from('clubhouse_events')
    .select('*')
    .ilike('name', '%NORTHFORLAND%')
    .single();

  if (eventError) {
    if (eventError.code === '42P01') {
      console.log('❌ clubhouse_events table DOES NOT EXIST!');
      console.log('   Schema must be applied from: scripts/clubhouse/01-create-schema.sql');
      console.log('');
      process.exit(1);
    } else if (eventError.code === 'PGRST116') {
      console.log('❌ No NORTHFORLAND event found in Clubhouse system');
      console.log('');
      process.exit(1);
    } else {
      console.log('❌ Error:', eventError.message);
      console.log('');
      process.exit(1);
    }
  }

  console.log('✅ Event Found:');
  console.log('   Name:', event.name);
  console.log('   ID:', event.id);
  console.log('   Status:', event.status);
  console.log('   Start Date:', event.start_date);
  console.log('   End Date:', event.end_date);
  console.log('   Reg Opens:', event.registration_opens_at);
  console.log('   Reg Closes:', event.registration_closes_at);
  console.log('   Default Golfer Group:', event.default_golfer_group_id);
  console.log('');

  // 2. Check timing
  const now = new Date();
  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);
  const regOpens = new Date(event.registration_opens_at);
  const regCloses = new Date(event.registration_closes_at);

  console.log('2. Timing Analysis:');
  console.log('   Current time:', now.toISOString());
  console.log('   Registration opens:', regOpens.toISOString(), now > regOpens ? '(PASSED)' : '(FUTURE)');
  console.log('   Registration closes:', regCloses.toISOString(), now > regCloses ? '(CLOSED)' : '(OPEN)');
  console.log('   Event starts:', startDate.toISOString(), now > startDate ? '(STARTED)' : '(UPCOMING)');
  console.log('   Event ends:', endDate.toISOString(), now > endDate ? '(ENDED)' : '(ONGOING/UPCOMING)');
  console.log('');

  // 3. Calculate expected status
  let expectedStatus;
  if (now > endDate) {
    expectedStatus = 'completed';
  } else if (now >= startDate) {
    expectedStatus = 'active';
  } else if (now >= regOpens) {
    expectedStatus = 'open';
  } else {
    expectedStatus = 'upcoming';
  }

  console.log('3. Status Check:');
  console.log('   Current status:', event.status);
  console.log('   Expected status:', expectedStatus);
  if (event.status === expectedStatus) {
    console.log('   ✅ Status is CORRECT');
  } else {
    console.log('   ❌ Status MISMATCH! Should be:', expectedStatus);
  }
  console.log('');

  // 4. Check competitions
  console.log('4. Competitions:');
  const { data: competitions, error: compError } = await supabase
    .from('clubhouse_competitions')
    .select('*')
    .eq('event_id', event.id);

  if (compError) {
    console.log('   ❌ Error fetching competitions:', compError.message);
  } else {
    console.log('   Total competitions:', competitions?.length || 0);
    if (competitions && competitions.length > 0) {
      competitions.forEach((comp, i) => {
        console.log(`   Competition ${i + 1}:`);
        console.log('     ID:', comp.id);
        console.log('     Entry Credits:', comp.entry_credits);
        console.log('     Max Entries:', comp.max_entries);
        console.log('     Golfer Group:', comp.assigned_golfer_group_id ? comp.assigned_golfer_group_id.substring(0, 8) + '...' : 'None');
      });
    }
  }
  console.log('');

  // 5. Check entries
  if (competitions && competitions.length > 0) {
    console.log('5. Entries:');
    const competitionIds = competitions.map(c => c.id);
    const { data: entries, error: entriesError } = await supabase
      .from('clubhouse_entries')
      .select('id, user_id, created_at')
      .in('competition_id', competitionIds);

    if (entriesError) {
      console.log('   ❌ Error fetching entries:', entriesError.message);
    } else {
      console.log('   Total entries:', entries?.length || 0);
      if (entries && entries.length > 0) {
        console.log('   Recent entries:');
        entries.slice(0, 5).forEach((entry, i) => {
          console.log(`     ${i + 1}. User: ${entry.user_id.substring(0, 8)}... at ${entry.created_at}`);
        });
      }
    }
  }
  console.log('');

  // 6. System identification
  console.log('6. System Identification:');
  console.log('   ✅ This is a CLUBHOUSE event');
  console.log('   Table: clubhouse_events (NOT tournaments)');
  console.log('   URL: /clubhouse/events/' + event.id);
  console.log('   API: /api/clubhouse/events/' + event.id);
  console.log('');

  // 7. Compare with InPlay (if any similar names)
  console.log('7. Checking for InPlay conflicts:');
  const { data: inplayTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date')
    .ilike('name', '%NORTHFORLAND%');

  if (inplayTournaments && inplayTournaments.length > 0) {
    console.log('   ⚠️  Found similar tournament(s) in InPlay system:');
    inplayTournaments.forEach(t => {
      console.log('     - Name:', t.name);
      console.log('       ID:', t.id);
      console.log('       Status:', t.status);
      console.log('       Dates:', t.start_date, 'to', t.end_date);
      console.log('       URL: /tournaments/' + t.slug || 'unknown');
    });
    console.log('');
    console.log('   IMPORTANT: These are DIFFERENT events in DIFFERENT systems!');
  } else {
    console.log('   ✅ No InPlay tournaments with similar names');
  }

  console.log('');
  console.log('=== SUMMARY ===');
  console.log('Event:', event.name);
  console.log('System: CLUBHOUSE');
  console.log('Status:', event.status, event.status === expectedStatus ? '✅ CORRECT' : '❌ NEEDS UPDATE');
  console.log('Competitions:', competitions?.length || 0);
  console.log('Entries:', 'Check above');
})();
