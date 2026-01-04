require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== COMPREHENSIVE SYSTEM CHECK ===\n');
  console.log('Current Time:', new Date().toISOString());
  console.log('');

  // 1. Check InPlay system (tournaments table)
  console.log('1. INPLAY SYSTEM (tournaments table):');
  console.log('   =====================================');
  const { data: inplayTournaments, error: inplayError } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date, end_date')
    .ilike('name', '%NORTHFORLAND%');

  if (inplayError) {
    console.log('   ❌ Error:', inplayError.message);
  } else {
    console.log('   Found', inplayTournaments?.length || 0, 'tournament(s)');
    inplayTournaments?.forEach(t => {
      console.log('   - Name:', t.name);
      console.log('     ID:', t.id);
      console.log('     Status:', t.status);
      console.log('     Start:', t.start_date);
      console.log('     End:', t.end_date);
      console.log('');
    });
  }

  // 2. Check Clubhouse system (clubhouse_events table)
  console.log('2. CLUBHOUSE SYSTEM (clubhouse_events table):');
  console.log('   ============================================');
  const { data: clubhouseEvents, error: clubhouseError } = await supabase
    .from('clubhouse_events')
    .select('id, name, status, start_date, end_date, registration_opens_at, registration_closes_at')
    .ilike('name', '%NORTHFORLAND%');

  if (clubhouseError) {
    if (clubhouseError.code === '42P01') {
      console.log('   ❌ TABLE DOES NOT EXIST!');
      console.log('   Schema must be applied from: scripts/clubhouse/01-create-schema.sql');
    } else {
      console.log('   ❌ Error:', clubhouseError.message);
    }
  } else {
    console.log('   ✅ Table exists');
    console.log('   Found', clubhouseEvents?.length || 0, 'event(s)');
    clubhouseEvents?.forEach(e => {
      console.log('   - Name:', e.name);
      console.log('     ID:', e.id);
      console.log('     Status:', e.status);
      console.log('     Start:', e.start_date);
      console.log('     End:', e.end_date);
      console.log('     Reg Opens:', e.registration_opens_at);
      console.log('     Reg Closes:', e.registration_closes_at);
      console.log('');
    });
  }

  // 3. System Summary
  console.log('3. SYSTEM ARCHITECTURE:');
  console.log('   =====================');
  console.log('   INPLAY SYSTEM:');
  console.log('     Tables: tournaments, tournament_competitions, competition_entries');
  console.log('     URL Pattern: /tournaments/[slug]');
  console.log('     API Routes: /api/tournaments/*');
  console.log('');
  console.log('   CLUBHOUSE SYSTEM:');
  console.log('     Tables: clubhouse_events, clubhouse_competitions, clubhouse_entries');
  console.log('     URL Pattern: /clubhouse/events/[id]');
  console.log('     API Routes: /api/clubhouse/*');
  console.log('');

  // 4. Check for naming conflicts
  if (inplayTournaments && clubhouseEvents) {
    const inplayNames = new Set(inplayTournaments.map(t => t.name.toLowerCase()));
    const clubhouseNames = new Set(clubhouseEvents.map(e => e.name.toLowerCase()));
    
    const conflicts = [...inplayNames].filter(name => clubhouseNames.has(name));
    
    if (conflicts.length > 0) {
      console.log('4. ⚠️  NAME CONFLICTS DETECTED:');
      console.log('   ===========================');
      conflicts.forEach(name => {
        console.log('   - "' + name + '" exists in BOTH systems');
      });
      console.log('');
      console.log('   RECOMMENDATION:');
      console.log('   - Add system identifier to all queries (table name prefix)');
      console.log('   - Add source field to events/tournaments');
      console.log('   - Update UI to clearly show which system each item belongs to');
    } else {
      console.log('4. ✅ No name conflicts detected');
    }
  }

  console.log('');
  console.log('=== END OF REPORT ===');
})();
