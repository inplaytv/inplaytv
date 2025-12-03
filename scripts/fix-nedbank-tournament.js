const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://qemosikbhrnstcormhuz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlbW9zaWtiaHJuc3Rjb3JtaHV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDUyMjE0NywiZXhwIjoyMDc2MDk4MTQ3fQ.gZsqr3-DtrScfPMXmFWHyJfA6_BnQxeCLlHi9ZKMvkI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixNedbank() {
  const tournamentId = '88fbe29c-83c0-4be9-b03b-897d3fb2209f';
  
  console.log('\n🔧 Fixing Nedbank Tournament Setup...\n');
  
  // Find the Nedbank golfer group
  const { data: groups } = await supabase
    .from('golfer_groups')
    .select('*')
    .ilike('name', '%nedbank%')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (!groups || groups.length === 0) {
    console.log('❌ No Nedbank golfer group found');
    return;
  }
  
  const group = groups[0];
  console.log(`✅ Found golfer group: ${group.name} (${group.id.substring(0,8)}...)`);
  
  // Link group to tournament
  console.log('\n📎 Linking group to tournament...');
  const { error: linkError } = await supabase
    .from('golfer_groups')
    .update({ tournament_id: tournamentId })
    .eq('id', group.id);
  
  if (linkError) {
    console.error('❌ Failed to link group:', linkError);
    return;
  }
  console.log('✅ Group linked to tournament');
  
  // Add golfers from group to tournament_golfers
  console.log('\n👥 Adding golfers to tournament...');
  const { data: members } = await supabase
    .from('golfer_group_members')
    .select('golfer_id')
    .eq('group_id', group.id);
  
  if (members && members.length > 0) {
    const tournamentGolfers = members.map(m => ({
      tournament_id: tournamentId,
      golfer_id: m.golfer_id
    }));
    
    const { error: insertError } = await supabase
      .from('tournament_golfers')
      .upsert(tournamentGolfers, { 
        onConflict: 'tournament_id,golfer_id',
        ignoreDuplicates: true 
      });
    
    if (insertError) {
      console.error('❌ Failed to add golfers:', insertError);
    } else {
      console.log(`✅ Added ${members.length} golfers to tournament`);
    }
  }
  
  // Check if tournament has competitions
  const { data: competitions } = await supabase
    .from('competitions')
    .select('id')
    .eq('tournament_id', tournamentId);
  
  console.log(`\n🏆 Tournament has ${competitions?.length || 0} competitions`);
  
  if (!competitions || competitions.length === 0) {
    console.log('\n⚠️  Tournament has no competitions!');
    console.log('You need to create competitions in the admin panel:');
    console.log('1. Go to tournament settings');
    console.log('2. Add competitions (Full Course, Beat The Cut, etc.)');
    console.log('3. The golfer group will automatically be linked to them');
  } else {
    // Link group to all competitions
    console.log('\n🔗 Linking group to competitions...');
    const competitionLinks = competitions.map(c => ({
      competition_id: c.id,
      golfer_group_id: group.id
    }));
    
    const { error: compError } = await supabase
      .from('competition_golfer_groups')
      .upsert(competitionLinks, {
        onConflict: 'competition_id,golfer_group_id',
        ignoreDuplicates: true
      });
    
    if (compError) {
      console.error('❌ Failed to link to competitions:', compError);
    } else {
      console.log(`✅ Linked group to ${competitions.length} competitions`);
    }
  }
  
  console.log('\n✅ Done! Check the admin panel now.');
}

fixNedbank();
