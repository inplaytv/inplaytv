require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING CLUBHOUSE SYSTEM TABLES ===\n');

  // 1. Check if clubhouse tables exist
  console.log('1. Checking clubhouse_events table...');
  const { data: events, error: eventsError } = await supabase
    .from('clubhouse_events')
    .select('*')
    .limit(5);

  if (eventsError) {
    if (eventsError.code === '42P01') {
      console.log('❌ clubhouse_events table DOES NOT EXIST!');
      console.log('   Schema needs to be applied from: scripts/clubhouse/01-create-schema.sql\n');
    } else {
      console.log('❌ Error:', eventsError.message, '\n');
    }
  } else {
    console.log('✅ clubhouse_events table exists');
    console.log('   Total events:', events.length);
    if (events.length > 0) {
      console.log('\n   Events found:');
      events.forEach(e => {
        console.log(`   - ${e.name} (status: ${e.status}, id: ${e.id.substring(0, 8)}...)`);
      });
    }
    console.log('');
  }

  // 2. Search for NORTHFORLAND in clubhouse
  console.log('2. Searching for NORTHFORLAND in clubhouse_events...');
  const { data: northforland, error: northError } = await supabase
    .from('clubhouse_events')
    .select('*')
    .ilike('name', '%NORTHFORLAND%');

  if (northError) {
    console.log('❌ Error searching:', northError.message);
  } else if (northforland && northforland.length > 0) {
    console.log('✅ Found in clubhouse:');
    northforland.forEach(event => {
      console.log(`   Name: ${event.name}`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Start: ${event.start_date}`);
      console.log(`   End: ${event.end_date}`);
      console.log(`   Reg Opens: ${event.registration_opens_at}`);
      console.log(`   Reg Closes: ${event.registration_closes_at}`);
      console.log('');
    });
  } else {
    console.log('   No NORTHFORLAND events found in clubhouse_events');
  }

  // 3. Compare with InPlay system
  console.log('3. Comparing with InPlay system (tournaments table)...');
  const { data: inplayTournament } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date')
    .ilike('name', '%NORTHFORLAND%');

  if (inplayTournament && inplayTournament.length > 0) {
    console.log('   Found in InPlay:');
    inplayTournament.forEach(t => {
      console.log(`   Name: ${t.name}`);
      console.log(`   ID: ${t.id}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Start: ${t.start_date}`);
      console.log(`   End: ${t.end_date}`);
      console.log('');
    });
  }

  console.log('=== SUMMARY ===');
  console.log('Clubhouse uses: clubhouse_events, clubhouse_competitions, clubhouse_entries');
  console.log('InPlay uses: tournaments, tournament_competitions, competition_entries');
  console.log('These are COMPLETELY SEPARATE systems!');
})();
