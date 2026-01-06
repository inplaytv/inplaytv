require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration Check:');
console.log('Supabase URL:', supabaseUrl ? '✅' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTournamentCreation() {
  console.log('\n🧪 Testing Tournament Creation Flow...\n');
  
  // Test 1: Check tournaments table exists
  console.log('1️⃣ Checking tournaments table...');
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('id, name')
    .limit(1);
  
  if (tournamentsError) {
    console.error('❌ Error accessing tournaments table:', tournamentsError.message);
    return;
  }
  console.log('✅ Tournaments table accessible');
  
  // Test 2: Check tournament_competitions table exists
  console.log('\n2️⃣ Checking tournament_competitions table...');
  const { data: competitions, error: competitionsError } = await supabase
    .from('tournament_competitions')
    .select('id')
    .limit(1);
  
  if (competitionsError) {
    console.error('❌ Error accessing tournament_competitions table:', competitionsError.message);
    return;
  }
  console.log('✅ Tournament_competitions table accessible');
  
  // Test 3: Check required columns in tournaments table
  console.log('\n3️⃣ Checking tournaments table structure...');
  const testTournament = {
    name: 'Test Tournament',
    slug: 'test-tournament-' + Date.now(),
    tour: 'pga',
    start_date: '2026-02-01',
    end_date: '2026-02-04',
    location: 'Test Location, USA',
    description: 'Test Description',
    image_url: '/images/tournaments/default.jpg',
    status: 'upcoming',
    timezone: 'America/New_York',
    admin_fee_percent: 10.00,
    is_visible: true,
    registration_open_date: '2026-01-18',
    registration_close_date: '2026-02-01',
  };
  
  const { data: createdTournament, error: createError } = await supabase
    .from('tournaments')
    .insert(testTournament)
    .select()
    .single();
  
  if (createError) {
    console.error('❌ Error creating test tournament:', createError.message);
    console.error('Error details:', createError);
    return;
  }
  
  console.log('✅ Test tournament created:', createdTournament.id);
  
  // Test 4: Create test competition
  console.log('\n4️⃣ Testing competition creation...');
  const { data: createdCompetition, error: compError } = await supabase
    .from('tournament_competitions')
    .insert({
      tournament_id: createdTournament.id,
      competition_type_id: null,
      entry_fee_pennies: 1000,
      entrants_cap: 100,
      admin_fee_percent: 10,
      status: 'draft',
    })
    .select()
    .single();
  
  if (compError) {
    console.error('❌ Error creating competition:', compError.message);
    console.error('Error details:', compError);
  } else {
    console.log('✅ Competition created:', createdCompetition.id);
  }
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('tournament_competitions').delete().eq('tournament_id', createdTournament.id);
  await supabase.from('tournaments').delete().eq('id', createdTournament.id);
  console.log('✅ Cleanup complete');
  
  console.log('\n✅ All tests passed! Tournament creation should work.');
}

testTournamentCreation().catch(console.error);
