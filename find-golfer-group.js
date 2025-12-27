require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Finding golfer group for ONE 2 ONE instance...\n');
  
  const { data: instance } = await supabase
    .from('competition_instances')
    .select(`
      id,
      tournament_id,
      template_id,
      competition_templates (
        name
      )
    `)
    .eq('id', 'fddc6a89-37bf-4592-a1a5-8e80643954a9')
    .single();
  
  console.log('Instance:', instance);
  
  if (instance?.tournament_id) {
    const { data: tournament } = await supabase
      .from('tournaments')
      .select('id, name, golfer_group_id')
      .eq('id', instance.tournament_id)
      .single();
    
    console.log('\nTournament:', tournament);
    
    if (tournament?.golfer_group_id) {
      console.log('\n✅ Golfer group:', tournament.golfer_group_id);
    } else {
      console.log('\n❌ No golfer_group_id on tournament!');
    }
  }
}

checkSchema();
