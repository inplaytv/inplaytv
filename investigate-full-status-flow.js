require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigateFully() {
  console.log('=== FULL INVESTIGATION OF FINAL STRIKE STATUS ===\n');
  console.log('Current time:', new Date().toISOString());
  console.log('');
  
  // 1. Check database directly
  console.log('1. DATABASE QUERY (What Supabase has):');
  const { data: dbData } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      start_at,
      reg_close_at,
      reg_open_at,
      competition_types (name, round_start),
      tournaments (name, slug, round_4_start)
    `)
    .eq('competition_type_id', (await supabase.from('competition_types').select('id').ilike('name', '%final%strike%').single()).data.id);
    
  console.log(JSON.stringify(dbData, null, 2));
  console.log('');
  
  // 2. Check what API returns (simulate the GET request)
  console.log('2. API ROUTE RESPONSE (What /api/tournaments/[slug] returns):');
  
  if (dbData && dbData.length > 0) {
    const comp = dbData[0];
    const tournament = comp.tournaments;
    
    console.log('Tournament slug:', tournament.slug);
    console.log('API would return this competition object:');
    console.log({
      id: comp.id,
      status: comp.status,
      start_at: comp.start_at,
      reg_close_at: comp.reg_close_at,
      reg_open_at: comp.reg_open_at,
      competition_types: comp.competition_types
    });
    console.log('');
    
    // 3. Simulate frontend status logic
    console.log('3. FRONTEND STATUS LOGIC (What getStatusBadge() would return):');
    const now = new Date();
    const regCloseAt = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    const compStartAt = comp.start_at ? new Date(comp.start_at) : null;
    const regOpenAt = comp.reg_open_at ? new Date(comp.reg_open_at) : null;
    
    console.log('Parsed dates:');
    console.log('  now:', now.toISOString());
    console.log('  regOpenAt:', regOpenAt?.toISOString() || 'null');
    console.log('  regCloseAt:', regCloseAt?.toISOString() || 'null');
    console.log('  compStartAt:', compStartAt?.toISOString() || 'null');
    console.log('');
    
    console.log('Boolean checks:');
    console.log('  now >= regCloseAt?', regCloseAt ? now >= regCloseAt : 'N/A', '(is reg closed?)');
    console.log('  now < regCloseAt?', regCloseAt ? now < regCloseAt : 'N/A', '(is reg still open?)');
    console.log('  now >= compStartAt?', compStartAt ? now >= compStartAt : 'N/A', '(has comp started?)');
    console.log('');
    
    console.log('Status badge logic flow:');
    if (regCloseAt && now >= regCloseAt) {
      console.log('  ❌ WRONG PATH: now >= regCloseAt (line 677)');
      if (compStartAt && now >= compStartAt) {
        console.log('     Would show: LIVE');
      } else if (compStartAt && now < compStartAt) {
        console.log('     Would show: AWAITING START ← THIS IS THE BUG!');
      }
    } else if (regOpenAt && regCloseAt && now >= regOpenAt && now < regCloseAt) {
      console.log('  ✅ CORRECT PATH: Registration window check (line 697-701)');
      console.log('     Should show: REGISTRATION OPEN');
    } else {
      console.log('  ⚠️ FALLBACK PATH: Using database status field');
      console.log('     Would show:', comp.status);
    }
    console.log('');
    
    // 4. Check countdown logic
    console.log('4. COUNTDOWN HOOK (What useCountdown() would return):');
    console.log('  Target date passed:', regCloseAt?.toISOString() || 'null');
    console.log('  Competition start:', compStartAt?.toISOString() || 'null');
    
    if (!regCloseAt) {
      console.log('  Result: "TBA" (no regCloseAt)');
    } else {
      const diff = regCloseAt - now;
      if (diff <= 0 && compStartAt) {
        const timeUntilStart = compStartAt - now;
        if (timeUntilStart > 0) {
          console.log('  Result: Countdown to comp start');
        } else {
          console.log('  Result: "Live Now"');
        }
      } else if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        console.log(`  Result: ${hours} hours until reg close`);
      }
    }
  }
  
  console.log('');
  console.log('=== ANALYSIS ===');
  console.log('If "Awaiting Start" is showing, it means:');
  console.log('  - The code thinks now >= regCloseAt (registration has closed)');
  console.log('  - BUT the database says reg_close_at is Jan 2, 2026 (2 days from now)');
  console.log('  - Possible causes:');
  console.log('    1. reg_close_at is NULL in database');
  console.log('    2. Date parsing is failing');
  console.log('    3. Timezone conversion issue');
  console.log('    4. The API is not returning reg_close_at field');
}

investigateFully().catch(console.error);
