require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWestgateTournaments() {
  console.log('\n🔍 Checking tournaments from API query...\n');

  // Replicate the exact API query from apps/golf/src/app/api/tournaments/route.ts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('is_visible', true)
    .in('status', ['upcoming', 'registration_open', 'registration_closed', 'live'])
    .gte('end_date', todayStr)
    .order('start_date', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`📋 Found ${tournaments.length} tournaments:\n`);
  
  tournaments.forEach(t => {
    console.log(`Tournament: ${t.name}`);
    console.log(`  - ID: ${t.id}`);
    console.log(`  - Status: ${t.status}`);
    console.log(`  - Visible: ${t.is_visible}`);
    console.log(`  - Dates: ${t.start_date} to ${t.end_date}`);
    console.log(`  - Slug: ${t.slug}`);
    console.log('');
  });

  // Check specifically for Westgate
  const westgate = tournaments.find(t => t.name.toLowerCase().includes('westgate') || t.name.toLowerCase().includes('birchington'));
  
  if (westgate) {
    console.log('✅ WESTGATE FOUND IN QUERY!\n');
    console.log('🔍 Checking its competitions...\n');

    const { data: comps, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        status,
        reg_open_at,
        reg_close_at,
        start_at,
        competition_format,
        competition_types (name, slug)
      `)
      .eq('tournament_id', westgate.id)
      .eq('competition_format', 'inplay');

    if (compError) {
      console.error('❌ Competition error:', compError);
    } else {
      console.log(`Found ${comps.length} InPlay competitions:\n`);
      comps.forEach(c => {
        const now = new Date();
        const regCloseAt = c.reg_close_at ? new Date(c.reg_close_at) : null;
        const isRegOpen = regCloseAt && now < regCloseAt;
        
        console.log(`Competition: ${c.competition_types?.name || 'Unknown'}`);
        console.log(`  - ID: ${c.id}`);
        console.log(`  - Status: ${c.status}`);
        console.log(`  - Reg Close: ${c.reg_close_at}`);
        console.log(`  - Start: ${c.start_at}`);
        console.log(`  - Registration Open? ${isRegOpen ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
    }
  } else {
    console.log('❌ WESTGATE NOT FOUND in query results');
    console.log('\n🔍 Let me check if it exists in the database...\n');

    const { data: westgateCheck } = await supabase
      .from('tournaments')
      .select('*')
      .ilike('name', '%westgate%')
      .single();

    if (westgateCheck) {
      console.log('⚠️  WESTGATE EXISTS but was filtered out:');
      console.log(`  - Status: ${westgateCheck.status} (needs to be in: upcoming, registration_open, registration_closed, live)`);
      console.log(`  - Is Visible: ${westgateCheck.is_visible} (needs to be true)`);
      console.log(`  - End Date: ${westgateCheck.end_date} (needs to be >= ${todayStr})`);
    } else {
      console.log('❌ WESTGATE does not exist in database');
    }
  }
}

checkWestgateTournaments().catch(console.error);
