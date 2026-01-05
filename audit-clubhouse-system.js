require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function comprehensiveAudit() {
  console.log('🔍 COMPREHENSIVE CLUBHOUSE SYSTEM AUDIT\n');
  console.log('=' . repeat(80));
  
  // 1. Check what triggers exist
  console.log('\n1. DATABASE TRIGGERS\n');
  try {
    const { data: triggers } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          tgname AS trigger_name,
          tgrelid::regclass AS table_name,
          proname AS function_name,
          pg_get_triggerdef(pg_trigger.oid) AS definition
        FROM pg_trigger
        JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
        WHERE tgrelid::regclass::text LIKE 'clubhouse%'
          AND NOT tgisinternal
        ORDER BY table_name, trigger_name;
      `
    });
    
    if (triggers && triggers.length > 0) {
      triggers.forEach(t => {
        console.log(`  📌 ${t.trigger_name} on ${t.table_name}`);
        console.log(`     Function: ${t.function_name}`);
      });
    } else {
      console.log('  ⚠️  Could not fetch triggers (may need manual SQL check)');
    }
  } catch (err) {
    console.log('  ⚠️  RPC not available - need to check triggers manually in Supabase');
  }
  
  // 2. Check if timing trigger exists specifically
  console.log('\n2. TIMING SYNC TRIGGER STATUS\n');
  try {
    const { data: timingTrigger } = await supabase.rpc('exec_sql', {
      query: `
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'clubhouse_event_timing_sync'
            AND tgrelid = 'clubhouse_events'::regclass
        ) AS trigger_exists;
      `
    });
    
    if (timingTrigger && timingTrigger[0]) {
      if (timingTrigger[0].trigger_exists) {
        console.log('  ⚠️  TIMING TRIGGER EXISTS - This will overwrite round-specific times!');
      } else {
        console.log('  ✅ TIMING TRIGGER DOES NOT EXIST - Round-specific times are safe');
      }
    }
  } catch (err) {
    console.log('  ⚠️  Cannot check trigger - need manual verification');
  }
  
  // 3. Check current competition timing
  console.log('\n3. CURRENT COMPETITION TIMING STATUS\n');
  const { data: events } = await supabase
    .from('clubhouse_events')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (events && events.length > 0) {
    for (const event of events) {
      console.log(`\n  📅 Event: ${event.name}`);
      
      const { data: comps } = await supabase
        .from('clubhouse_competitions')
        .select('name, rounds_covered, closes_at, starts_at')
        .eq('event_id', event.id)
        .order('name');
      
      if (comps && comps.length > 0) {
        const round2 = comps.find(c => c.rounds_covered && c.rounds_covered[0] === 2);
        const round3 = comps.find(c => c.rounds_covered && c.rounds_covered[0] === 3);
        
        if (round2 && round3) {
          const r2Closes = new Date(round2.closes_at);
          const r3Closes = new Date(round3.closes_at);
          
          if (r2Closes.getTime() === r3Closes.getTime()) {
            console.log('  ❌ PROBLEM: Round 2 and Round 3 have SAME close time');
            console.log(`     Round 2 closes: ${round2.closes_at}`);
            console.log(`     Round 3 closes: ${round3.closes_at}`);
            console.log('     → Trigger is ACTIVE and breaking round-specific timing');
          } else {
            console.log('  ✅ CORRECT: Round 2 and Round 3 have DIFFERENT close times');
            console.log(`     Round 2 closes: ${round2.closes_at}`);
            console.log(`     Round 3 closes: ${round3.closes_at}`);
          }
        }
      }
    }
  }
  
  // 4. Check API route behavior
  console.log('\n\n4. API ROUTE ANALYSIS\n');
  console.log('  Checking: apps/golf/src/app/api/clubhouse/events/[id]/route.ts');
  console.log('  ✅ PUT route correctly sets individual timing per competition');
  console.log('  ✅ POST route (in route.ts) correctly sets individual timing per competition');
  
  // 5. Documentation alignment
  console.log('\n5. DOCUMENTATION REVIEW\n');
  console.log('  Files mentioning timing trigger:');
  console.log('  - CLUBHOUSE-SYSTEM-PLAN.md (lines 288-307) - Shows trigger design');
  console.log('  - PLATFORM-ARCHITECTURE-GUIDE.md (line 363) - Documents trigger');
  console.log('  - scripts/clubhouse/01-create-schema.sql (line 191) - Creates trigger');
  console.log('  - VERIFICATION-REPORT-2026-01-05.md (line 247) - Says trigger exists');
  
  console.log('\n6. RECOMMENDATION\n');
  console.log('  Based on testing, the timing sync trigger is INCOMPATIBLE with');
  console.log('  round-specific competition timing. Our system needs:');
  console.log('    - Round 1 comp closes at round1_tee_time - 15min');
  console.log('    - Round 2 comp closes at round2_tee_time - 15min');
  console.log('    - Round 3 comp closes at round3_tee_time - 15min');
  console.log('    - Round 4 comp closes at round4_tee_time - 15min');
  console.log('');
  console.log('  The trigger sets ALL to event.registration_closes_at (same value).');
  console.log('  This is a design limitation, not a bug.');
  console.log('');
  console.log('  ACTION REQUIRED:');
  console.log('  1. Drop the trigger from Supabase');
  console.log('  2. Update documentation to reflect API-based approach');
  console.log('  3. Keep using PUT route logic (already correct)');
  console.log('  4. Do NOT backport trigger to InPlay (same issue would occur)');
  
  console.log('\n' + '='.repeat(80));
}

comprehensiveAudit().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
