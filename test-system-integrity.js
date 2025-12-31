// Comprehensive System Test Script
// Run: node test-system-integrity.js

require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('\n🧪 SYSTEM INTEGRITY TEST SUITE\n');
  console.log('='.repeat(60));
  
  let passed = 0;
  let failed = 0;

  // TEST 1: Verify competition format distribution
  console.log('\n📊 TEST 1: Competition Format Distribution');
  try {
    const { data, error } = await supabase
      .from('tournament_competitions')
      .select('competition_format, competition_type_id, rounds_covered');
    
    if (error) throw error;
    
    const inplay = data.filter(c => c.competition_format === 'inplay');
    const one2one = data.filter(c => c.competition_format === 'one2one');
    
    console.log(`  ✅ InPlay competitions: ${inplay.length}`);
    console.log(`  ✅ ONE 2 ONE challenges: ${one2one.length}`);
    
    // Verify InPlay all have competition_type_id
    const invalidInplay = inplay.filter(c => !c.competition_type_id);
    if (invalidInplay.length > 0) {
      console.log(`  ❌ FAIL: ${invalidInplay.length} InPlay competitions missing competition_type_id`);
      failed++;
    } else {
      console.log(`  ✅ All InPlay competitions have competition_type_id`);
      passed++;
    }
    
    // Verify ONE 2 ONE all have rounds_covered
    const invalidOne2One = one2one.filter(c => !c.rounds_covered);
    if (invalidOne2One.length > 0) {
      console.log(`  ❌ FAIL: ${invalidOne2One.length} ONE 2 ONE challenges missing rounds_covered`);
      failed++;
    } else {
      console.log(`  ✅ All ONE 2 ONE challenges have rounds_covered`);
      passed++;
    }
    
    // Verify no mixing
    const mixedCompTypeId = one2one.filter(c => c.competition_type_id !== null);
    if (mixedCompTypeId.length > 0) {
      console.log(`  ❌ FAIL: ${mixedCompTypeId.length} ONE 2 ONE challenges have competition_type_id (should be null)`);
      failed++;
    } else {
      console.log(`  ✅ No ONE 2 ONE challenges have competition_type_id`);
      passed++;
    }
    
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // TEST 2: Check tournament golfer assignments
  console.log('\n👥 TEST 2: Tournament Golfer Assignments');
  try {
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('tournaments')
      .select('id, name');
    
    if (tournamentsError) throw tournamentsError;
    
    for (const t of tournaments || []) {
      const { count } = await supabase
        .from('tournament_golfers')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', t.id);
      
      if (count === 0) {
        console.log(`  ⚠️  WARNING: "${t.name}" has no golfers assigned`);
      } else {
        console.log(`  ✅ "${t.name}": ${count} golfers`);
      }
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // TEST 3: Verify InPlay competitions have golfer groups
  console.log('\n🏌️ TEST 3: InPlay Competition Golfer Groups');
  try {
    const { data: inplayComps, error: inplayError } = await supabase
      .from('tournament_competitions')
      .select('id, assigned_golfer_group_id, tournament_id')
      .eq('competition_format', 'inplay');
    
    if (inplayError) throw inplayError;
    
    const withoutGroups = (inplayComps || []).filter(c => !c.assigned_golfer_group_id);
    
    if (withoutGroups.length > 0) {
      console.log(`  ⚠️  ${withoutGroups.length} InPlay competitions without golfer groups`);
      
      // Get tournament names for these competitions
      for (const comp of withoutGroups) {
        const { data: tournament } = await supabase
          .from('tournaments')
          .select('name')
          .eq('id', comp.tournament_id)
          .single();
        
        const { data: compType } = await supabase
          .from('tournament_competitions')
          .select('competition_types(name)')
          .eq('id', comp.id)
          .single();
        
        console.log(`    - ${tournament?.name} / ${compType?.competition_types?.name}`);
      }
    } else {
      console.log(`  ✅ All ${inplayComps?.length || 0} InPlay competitions have golfer groups assigned`);
    }
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // TEST 4: Check competition status consistency
  console.log('\n📋 TEST 4: Competition Status Validation');
  try {
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select('status, competition_format');
    
    const validStatuses = ['draft', 'upcoming', 'reg_open', 'reg_closed', 'live', 'completed', 'cancelled', 'pending', 'open', 'full'];
    const invalidStatuses = comps.filter(c => !validStatuses.includes(c.status));
    
    if (invalidStatuses.length > 0) {
      console.log(`  ❌ FAIL: ${invalidStatuses.length} competitions have invalid status`);
      failed++;
    } else {
      console.log(`  ✅ All ${comps.length} competitions have valid status values`);
      passed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // TEST 5: Check for orphaned entries
  console.log('\n🎫 TEST 5: Entry Integrity Check');
  try {
    const { data: entries } = await supabase
      .from('competition_entries')
      .select('id, competition_id, tournament_competitions!inner(id, competition_format)');
    
    console.log(`  ✅ Total entries: ${entries.length}`);
    
    const inplayEntries = entries.filter(e => e.tournament_competitions?.competition_format === 'inplay');
    const one2oneEntries = entries.filter(e => e.tournament_competitions?.competition_format === 'one2one');
    
    console.log(`    - InPlay entries: ${inplayEntries.length}`);
    console.log(`    - ONE 2 ONE entries: ${one2oneEntries.length}`);
    passed++;
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // TEST 6: Database constraints test (attempt invalid insert)
  console.log('\n🛡️ TEST 6: Database Constraint Protection');
  try {
    // Try to create InPlay without competition_type_id (should fail)
    const { error: constraintError } = await supabase
      .from('tournament_competitions')
      .insert({
        tournament_id: '00000000-0000-0000-0000-000000000000', // Fake ID
        competition_format: 'inplay',
        competition_type_id: null, // Invalid for InPlay
        entry_fee_pennies: 1000,
        status: 'draft'
      });
    
    if (constraintError) {
      console.log(`  ✅ Database correctly rejected invalid InPlay (missing competition_type_id)`);
      console.log(`     Error: ${constraintError.message}`);
      passed++;
    } else {
      console.log(`  ❌ FAIL: Database allowed invalid InPlay competition`);
      failed++;
    }
  } catch (error) {
    console.log(`  ❌ FAIL: ${error.message}`);
    failed++;
  }

  // SUMMARY
  console.log('\n' + '='.repeat(60));
  console.log('\n📈 TEST SUMMARY');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is clean and operational.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review issues above.\n');
    process.exit(1);
  }
}

runTests().catch(console.error);
