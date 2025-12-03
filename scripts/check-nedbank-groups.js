const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recreateNedbank() {
  const tournamentId = '88fbe29c-83c0-4be9-b03b-897d3fb2209f';
  
  console.log('\n🔧 Checking Nedbank setup...\n');
  
  // Check golfer groups for this tournament
  const { data: groups } = await supabase
    .from('golfer_groups')
    .select('*')
    .eq('tournament_id', tournamentId);
  
  console.log(`Found ${groups?.length || 0} golfer groups for Nedbank`);
  
  if (groups && groups.length > 0) {
    for (const group of groups) {
      const { count } = await supabase
        .from('golfer_group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id);
      
      console.log(`- Group: ${group.name} (${count} golfers)`);
    }
  }
  
  // Check all golfer groups (maybe not linked to tournament yet)
  const { data: allGroups } = await supabase
    .from('golfer_groups')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('\n📋 Recent golfer groups:');
  for (const group of allGroups) {
    const { count } = await supabase
      .from('golfer_group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id);
    
    console.log(`- ${group.name} (${count} golfers) - Tournament: ${group.tournament_id?.substring(0,8) || 'none'}`);
  }
}

recreateNedbank();
