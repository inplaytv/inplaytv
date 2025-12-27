require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const competitionId = '686e42b9-e2b5-42c3-90d6-fabae22b2e37'; // From URL

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompetition() {
  console.log(`\n🔍 Checking competition: ${competitionId}\n`);

  // Check if it's InPlay
  const { data: inplay, error: inplayError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      assigned_golfer_group_id,
      competition_types (name),
      tournaments!tournament_competitions_tournament_id_fkey (name)
    `)
    .eq('id', competitionId)
    .single();

  if (inplay && !inplayError) {
    console.log('✅ Found InPlay Competition:');
    console.log(`   Type: ${inplay.competition_types?.name}`);
    console.log(`   Tournament: ${inplay.tournaments?.name}`);
    console.log(`   Golfer Group ID: ${inplay.assigned_golfer_group_id || 'NULL ❌'}`);
    
    if (!inplay.assigned_golfer_group_id) {
      console.log('\n⚠️  No golfer group assigned! Checking available groups...\n');
      
      const { data: groups } = await supabase
        .from('golfer_groups')
        .select('id, name');
      
      console.log('Available Golfer Groups:');
      groups?.forEach(g => console.log(`   - ${g.name} (ID: ${g.id})`));
      
      console.log('\n💡 Fix: Assign a golfer group in Admin → Tournament Management');
    }
    return;
  }

  // Check if it's ONE 2 ONE
  const { data: one2one, error: one2oneError } = await supabase
    .from('competition_instances')
    .select(`
      id,
      competition_templates (
        name,
        assigned_golfer_group_id
      ),
      tournaments!competition_instances_tournament_id_fkey (name)
    `)
    .eq('id', competitionId)
    .single();

  if (one2one && !one2oneError) {
    console.log('✅ Found ONE 2 ONE Instance:');
    console.log(`   Template: ${one2one.competition_templates?.name}`);
    console.log(`   Tournament: ${one2one.tournaments?.name}`);
    console.log(`   Golfer Group ID: ${one2one.competition_templates?.assigned_golfer_group_id || 'NULL ❌'}`);
    
    if (!one2one.competition_templates?.assigned_golfer_group_id) {
      console.log('\n⚠️  No golfer group assigned to template! Checking available groups...\n');
      
      const { data: groups } = await supabase
        .from('golfer_groups')
        .select('id, name');
      
      console.log('Available Golfer Groups:');
      groups?.forEach(g => console.log(`   - ${g.name} (ID: ${g.id})`));
      
      console.log('\n💡 Fix: Assign a golfer group to the template in Admin → ONE 2 ONE Templates');
    }
    return;
  }

  console.log('❌ Competition not found!');
}

checkCompetition().catch(console.error);
