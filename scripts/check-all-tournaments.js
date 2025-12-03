const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'apps', 'golf', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllTournaments() {
  console.log('🔍 Checking ALL tournaments...\n');

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, status, event_id, tour, start_date, end_date')
    .order('start_date', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  for (const t of tournaments) {
    const { count } = await supabase
      .from('tournament_golfers')
      .select('golfer_id', { count: 'exact', head: true })
      .eq('tournament_id', t.id);

    console.log(`📊 ${t.name}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Tour: ${t.tour || 'N/A'}`);
    console.log(`   Event ID: ${t.event_id || 'N/A'}`);
    console.log(`   Dates: ${t.start_date} to ${t.end_date}`);
    console.log(`   Golfers: ${count || 0} ${count === 0 ? '⚠️' : '✅'}`);
    console.log('');
  }

  // Check the third tournament specifically (Hero World Challenge)
  console.log('\n🔍 Looking for Hero World Challenge...\n');
  
  const { data: hero } = await supabase
    .from('tournaments')
    .select('*')
    .ilike('name', '%hero%')
    .single();

  if (hero) {
    console.log('Found Hero:', hero.name);
    console.log('Status:', hero.status);
    console.log('Event ID:', hero.event_id);
    console.log('Tour:', hero.tour);
    
    const { count } = await supabase
      .from('tournament_golfers')
      .select('golfer_id', { count: 'exact', head: true })
      .eq('tournament_id', hero.id);
    
    console.log('Golfers:', count);
  } else {
    console.log('Hero World Challenge not found');
  }
}

checkAllTournaments().catch(console.error);
