require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const tid = '3bf785ea-f600-467e-85d0-be711914369a';
  
  console.log('🔧 ASSIGNING GOLFER GROUP TO ALL COMPETITIONS...\n');
  
  // Get the GREENIDGE golfer group
  const {data: group} = await supabase
    .from('golfer_groups')
    .select('id, name')
    .ilike('name', '%GREENIDGE%')
    .single();
  
  console.log('Group:', group.name);
  console.log('Group ID:', group.id);
  
  // Get all InPlay competitions for WESTGATE
  const {data: comps} = await supabase
    .from('tournament_competitions')
    .select('id')
    .eq('tournament_id', tid)
    .eq('competition_format', 'inplay');
  
  console.log('\nCompetitions to update:', comps.length);
  
  // Assign the group to all competitions
  const {error} = await supabase
    .from('tournament_competitions')
    .update({ assigned_golfer_group_id: group.id })
    .eq('tournament_id', tid)
    .eq('competition_format', 'inplay');
  
  if (error) {
    console.error('\n❌ Error:', error.message);
  } else {
    console.log('\n✅ SUCCESS! All competitions now have golfer group assigned!');
    console.log('\n🎯 Try building a team now - golfers should appear!');
    console.log('\n📝 Future tournaments will auto-assign when you add golfer groups.');
  }
})();
