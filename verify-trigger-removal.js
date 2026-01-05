require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyTriggerRemovalComplete() {
  console.log('\n🔍 TRIGGER REMOVAL VERIFICATION\n');
  console.log('='.repeat(80));
  
  // 1. Check trigger status in database
  console.log('\n1. DATABASE TRIGGER STATUS\n');
  try {
    // Try to check via query
    const { data: triggerCheck, error } = await supabase
      .from('clubhouse_events')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('  ⚠️  Cannot verify trigger directly (RLS or connection issue)');
    } else {
      console.log('  ℹ️  Database connection OK');
      console.log('  ℹ️  Manual verification required in Supabase SQL Editor:');
      console.log('     Run: SELECT * FROM pg_trigger WHERE tgname = \'clubhouse_event_timing_sync\';');
    }
  } catch (err) {
    console.log('  ⚠️  Cannot check trigger:', err.message);
  }
  
  // 2. Verify API routes have correct timing logic
  console.log('\n2. API ROUTES VERIFICATION\n');
  const apiFiles = [
    'apps/golf/src/app/api/clubhouse/events/route.ts',
    'apps/golf/src/app/api/clubhouse/events/[id]/route.ts'
  ];
  
  for (const file of apiFiles) {
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for round-specific timing logic
      const hasRoundTeeTimes = content.includes('roundTeeTimes') || content.includes('round_tee_time');
      const hasClosesAtCalculation = content.includes('subtract15Minutes') || content.includes('setMinutes');
      const hasRoundsCovered = content.includes('rounds_covered');
      
      console.log(`  📄 ${file}`);
      console.log(`     Round tee times: ${hasRoundTeeTimes ? '✅' : '❌'}`);
      console.log(`     Closes calculation: ${hasClosesAtCalculation ? '✅' : '❌'}`);
      console.log(`     Rounds covered logic: ${hasRoundsCovered ? '✅' : '❌'}`);
      
      if (hasRoundTeeTimes && hasClosesAtCalculation && hasRoundsCovered) {
        console.log(`     Status: ✅ CORRECT - Has round-specific timing logic`);
      } else {
        console.log(`     Status: ⚠️  MISSING - May not handle round-specific timing`);
      }
    } else {
      console.log(`  ❌ ${file} - NOT FOUND`);
    }
  }
  
  // 3. Check current competition timing
  console.log('\n3. CURRENT COMPETITION TIMING\n');
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
        .select('name, rounds_covered, opens_at, closes_at, starts_at')
        .eq('event_id', event.id)
        .order('name');
      
      if (comps && comps.length > 0) {
        const uniqueCloseTimes = new Set(comps.map(c => c.closes_at));
        
        if (uniqueCloseTimes.size === 1) {
          console.log('  ❌ PROBLEM: All competitions have SAME close time');
          console.log('     → This means trigger is still active OR API not calculating correctly');
          comps.forEach(c => {
            console.log(`     ${c.name}: closes ${c.closes_at}`);
          });
        } else {
          console.log(`  ✅ CORRECT: ${comps.length} competitions have ${uniqueCloseTimes.size} different close times`);
          
          // Show a few examples
          const round1 = comps.find(c => c.rounds_covered && c.rounds_covered.length === 1 && c.rounds_covered[0] === 1);
          const round2 = comps.find(c => c.rounds_covered && c.rounds_covered.length === 1 && c.rounds_covered[0] === 2);
          
          if (round1 && round2) {
            console.log(`     Round 1: closes ${round1.closes_at}`);
            console.log(`     Round 2: closes ${round2.closes_at}`);
            console.log(`     → Different times = round-specific timing working ✅`);
          }
        }
      }
    }
  }
  
  // 4. Documentation verification
  console.log('\n4. DOCUMENTATION UPDATE STATUS\n');
  const fs = require('fs');
  const path = require('path');
  
  const docsToCheck = [
    'CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md',
    'scripts/clubhouse/01-create-schema.sql',
    'scripts/clubhouse/02-clean-install.sql',
    'PLATFORM-ARCHITECTURE-GUIDE.md',
    'SYSTEMATIC-FIX-PLAN.md',
    'CLUBHOUSE-SYSTEM-PLAN.md',
  ];
  
  for (const doc of docsToCheck) {
    const filePath = path.join(__dirname, doc);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasAnalysis = content.includes('CLUBHOUSE-TIMING-TRIGGER-ANALYSIS');
      const hasRemovalNote = content.includes('REMOVED') || content.includes('removed');
      
      console.log(`  📝 ${doc}`);
      if (hasAnalysis || hasRemovalNote) {
        console.log(`     ✅ Updated with trigger removal info`);
      } else {
        console.log(`     ⚠️  May need updating`);
      }
    } else {
      console.log(`  ⚠️  ${doc} - NOT FOUND`);
    }
  }
  
  // 5. Test recommendations
  console.log('\n5. MANUAL TESTING REQUIRED\n');
  console.log('  After running drop-timing-trigger.sql in Supabase SQL Editor:');
  console.log('  1. Edit an existing event in admin panel');
  console.log('  2. Change event description (triggers UPDATE)');
  console.log('  3. Verify competitions maintain different close times');
  console.log('  4. Check browser console for API logs showing round-specific calculation');
  console.log('  5. Create new event from scratch');
  console.log('  6. Verify 5 competitions created with correct round-specific timing');
  
  console.log('\n6. SQL TO RUN IN SUPABASE\n');
  console.log('  File: scripts/clubhouse/drop-timing-trigger.sql');
  console.log('  Location: Supabase Dashboard → SQL Editor → New Query');
  console.log('  Copy contents of file and execute');
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Verification script complete');
  console.log('📋 Next step: Run scripts/clubhouse/drop-timing-trigger.sql in Supabase');
  console.log('🔗 See: CLUBHOUSE-TIMING-TRIGGER-ANALYSIS.md for full details');
}

verifyTriggerRemovalComplete().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
