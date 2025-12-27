require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompetitionGolferGroups() {
  console.log('🔍 Checking competition golfer group assignments...\n');

  // Check InPlay competitions
  const { data: inplayComps, error: inplayError } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      assigned_golfer_group_id,
      competition_types (name),
      tournaments!tournament_competitions_tournament_id_fkey (name)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (inplayError) {
    console.error('❌ Error fetching InPlay competitions:', inplayError);
  } else {
    console.log('📊 InPlay Competitions:');
    inplayComps?.forEach(comp => {
      const hasGroup = comp.assigned_golfer_group_id ? '✅' : '❌';
      console.log(`${hasGroup} ${comp.competition_types?.name} | Tournament: ${comp.tournaments?.name}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Group ID: ${comp.assigned_golfer_group_id || 'NULL'}\n`);
    });
  }

  // Check ONE 2 ONE instances
  const { data: one2oneInsts, error: one2oneError } = await supabase
    .from('competition_instances')
    .select(`
      id,
      competition_templates (name, assigned_golfer_group_id),
      tournaments!competition_instances_tournament_id_fkey (name),
      status
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (one2oneError) {
    console.error('❌ Error fetching ONE 2 ONE instances:', one2oneError);
  } else {
    console.log('\n📊 ONE 2 ONE Instances:');
    one2oneInsts?.forEach(inst => {
      const hasGroup = inst.competition_templates?.assigned_golfer_group_id ? '✅' : '❌';
      console.log(`${hasGroup} ${inst.competition_templates?.name} | Tournament: ${inst.tournaments?.name} | Status: ${inst.status}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Group ID (from template): ${inst.competition_templates?.assigned_golfer_group_id || 'NULL'}\n`);
    });
  }

  // Check if there are golfer groups
  const { data: groups, error: groupsError } = await supabase
    .from('golfer_groups')
    .select('id, name');

  if (groupsError) {
    console.error('❌ Error fetching golfer groups:', groupsError);
  } else {
    console.log('\n📊 Available Golfer Groups:');
    groups?.forEach(group => {
      console.log(`   ${group.name} (ID: ${group.id})`);
    });
  }
}

checkCompetitionGolferGroups().catch(console.error);
