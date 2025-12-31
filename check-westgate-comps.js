require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const tid = '3bf785ea-f600-467e-85d0-be711914369a';
  
  console.log('=== CHECKING WESTGATE TOURNAMENT COMPETITIONS ===\n');
  
  const {data: comps, error} = await supabase
    .from('tournament_competitions')
    .select('*')
    .eq('tournament_id', tid);
  
  if (error) {
    console.error('Query error:', error.message);
    return;
  }
  
  console.log('Total competitions found:', comps?.length || 0);
  
  if (comps && comps.length > 0) {
    console.log('\nColumns:', Object.keys(comps[0]).sort().join(', '));
    
    const inplay = comps.filter(c => c.competition_format === 'inplay');
    const one2one = comps.filter(c => c.competition_format === 'one2one');
    
    console.log('\n=== InPlay Competitions:', inplay.length, '===');
    inplay.forEach((c, i) => {
      console.log(`${i+1}. ID: ${c.id}`);
      console.log('   Type ID:', c.competition_type_id);
      console.log('   Golfer Group:', c.assigned_golfer_group_id);
      console.log('   Status:', c.status);
    });
    
    console.log('\n=== ONE 2 ONE Competitions:', one2one.length, '===');
    one2one.forEach((c, i) => {
      console.log(`${i+1}. ID: ${c.id}`);
      console.log('   Rounds:', c.rounds_covered);
      console.log('   Golfer Group:', c.assigned_golfer_group_id);
      console.log('   Status:', c.status);
    });
  } else {
    console.log('\n❌ NO COMPETITIONS FOUND');
    console.log('\nThis tournament needs competitions created.');
    console.log('Check if they were supposed to be auto-created on tournament creation.');
  }
})();
