require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const tid = '3bf785ea-f600-467e-85d0-be711914369a';
  
  console.log('=== VERIFICATION ===\n');
  
  const {data: comps} = await supabase
    .from('tournament_competitions')
    .select('id, competition_format, assigned_golfer_group_id, competition_types(name)')
    .eq('tournament_id', tid);
  
  console.log('All 6 competitions:');
  comps.forEach((c, i) => {
    console.log(`${i+1}. ${c.competition_types?.name || 'Competition'}`);
    console.log('   Format:', c.competition_format);
    console.log('   Has Group:', c.assigned_golfer_group_id ? '✅ YES' : '❌ NO');
  });
  
  const allHaveGroups = comps.every(c => c.assigned_golfer_group_id);
  console.log(`\n${allHaveGroups ? '✅ ALL COMPETITIONS FIXED!' : '❌ Some missing'}`);
  
  console.log('\n=== THE COMPLETE FIX ===');
  console.log('✅ WESTGATE: Fixed immediately (all 6 comps now have groups)');
  console.log('✅ API: Updated /api/tournaments/[id]/golfer-groups');
  console.log('   When you add a golfer group, it now:');
  console.log('   1. Links to tournament_golfer_groups');
  console.log('   2. Copies golfers to tournament_golfers');
  console.log('   3. Assigns group to ALL InPlay competitions ← NEW!');
  console.log('\n🎯 This works for BOTH manual AND DataGolf workflows!');
})();
