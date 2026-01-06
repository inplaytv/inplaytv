require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('🔍 COMPREHENSIVE TOURNAMENT DIAGNOSTIC\n');
  console.log('=' .repeat(80));
  
  // 1. Check tournaments table
  console.log('\n1️⃣ TOURNAMENTS IN DATABASE:');
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible, registration_opens_at, registration_closes_at, start_date')
    .order('start_date', { ascending: true });
  
  if (tournaments && tournaments.length > 0) {
    tournaments.forEach(t => {
      console.log(`\n   📋 ${t.name}`);
      console.log(`      Slug: ${t.slug}`);
      console.log(`      Status: ${t.status}`);
      console.log(`      Visible: ${t.is_visible}`);
      console.log(`      Reg Opens: ${t.registration_opens_at}`);
      console.log(`      Reg Closes: ${t.registration_closes_at}`);
      console.log(`      Start Date: ${t.start_date}`);
    });
  } else {
    console.log('   ❌ No tournaments found');
  }
  
  // 2. Check competitions for each tournament
  console.log('\n\n2️⃣ COMPETITIONS FOR EACH TOURNAMENT:');
  for (const t of tournaments || []) {
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        status,
        reg_open_at,
        reg_close_at,
        start_at,
        end_at,
        competition_type_id,
        competition_types (
          name
        )
      `)
      .eq('tournament_id', t.id);
    
    console.log(`\n   📋 ${t.name} (${comps?.length || 0} competitions):`);
    if (comps && comps.length > 0) {
      comps.forEach(c => {
        console.log(`      - ${c.competition_types?.name || 'Unknown Type'}`);
        console.log(`        Status: ${c.status}`);
        console.log(`        Reg Open: ${c.reg_open_at || 'NOT SET'}`);
        console.log(`        Reg Close: ${c.reg_close_at || 'NOT SET'}`);
        console.log(`        Start: ${c.start_at || 'NOT SET'}`);
      });
    } else {
      console.log('      ❌ No competitions found');
    }
  }
  
  // 3. Test the API endpoint
  console.log('\n\n3️⃣ TESTING /api/tournaments ENDPOINT:');
  try {
    const response = await fetch('http://localhost:3003/api/tournaments', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const tournamentsFromAPI = Array.isArray(data) ? data : (data.tournaments || []);
      console.log(`   ✅ API returned ${tournamentsFromAPI.length} tournaments`);
      
      if (tournamentsFromAPI.length > 0) {
        tournamentsFromAPI.forEach(t => {
          console.log(`\n   📋 ${t.name}`);
          console.log(`      Status: ${t.status}`);
          console.log(`      Competitions: ${t.competitions?.length || 0}`);
          if (t.competitions && t.competitions.length > 0) {
            t.competitions.forEach(c => {
              const now = new Date();
              const regClose = c.reg_close_at ? new Date(c.reg_close_at) : null;
              const isOpen = regClose && now < regClose;
              console.log(`        - ${c.competition_types?.name}: reg_close=${c.reg_close_at} (${isOpen ? 'OPEN' : 'CLOSED/NOT SET'})`);
            });
          }
        });
      }
    } else {
      console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ API Error: ${error.message}`);
  }
  
  // 4. Check visibility requirements
  console.log('\n\n4️⃣ VISIBILITY CHECK:');
  console.log('   For a tournament to show on /tournaments page:');
  console.log('   ✓ is_visible = true');
  console.log('   ✓ status IN (upcoming, registration_open, in_progress)');
  console.log('   ✓ At least one competition with reg_close_at > NOW()');
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Diagnostic Complete!\n');
}

diagnose().catch(console.error);
