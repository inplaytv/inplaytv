require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking how InPlay competitions get golfer groups...\n');
  
  // Check tournament_competitions with golfer group
  const { data: comp } = await supabase
    .from('tournament_competitions')
    .select('id, assigned_golfer_group_id, tournament_id')
    .not('assigned_golfer_group_id', 'is', null)
    .limit(1)
    .single();
  
  if (comp) {
    console.log('InPlay competition:', comp);
    
    // Get the golfer group details
    const { data: group } = await supabase
      .from('golfer_groups')
      .select('*')
      .eq('id', comp.assigned_golfer_group_id)
      .single();
    
    console.log('\nGolfer group:', group);
    
    // Check if there's a link table
    const { data: members } = await supabase
      .from('golfer_group_members')
      .select('golfer_id')
      .eq('group_id', comp.assigned_golfer_group_id)
      .limit(3);
    
    console.log('\nGolfer group has', members?.length || 0, 'members (showing 3)');
  }
}

checkSchema();
