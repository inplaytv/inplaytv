require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function investigate() {
  console.log('🔍 Investigating Final Strike Competition Creation\n');
  
  // 1. Get Final Strike competition details
  const { data: allComps } = await supabase
    .from('tournament_competitions')
    .select(`
      *,
      competition_types (
        id,
        name,
        slug,
        round_start
      )
    `);
    
  const comp = allComps?.find(c => c.competition_types?.name?.toLowerCase().includes('final strike'));
  
  if (!comp) {
    console.error('Final Strike competition not found');
    return;
  }
  
  console.log('📊 Final Strike Competition:');
  console.log('  ID:', comp.id);
  console.log('  Name:', comp.competition_types?.name);
  console.log('  Round Start:', comp.competition_types?.round_start);
  console.log('  start_at:', comp.start_at);
  console.log('  reg_close_at:', comp.reg_close_at);
  console.log('  Created at:', comp.created_at);
  console.log('  Updated at:', comp.updated_at);
  console.log('');
  
  // 2. Get the tournament to see what it SHOULD have been
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', comp.tournament_id)
    .single();
    
  console.log('🏆 Tournament (Northforland Open):');
  console.log('  Round 1 tee:', tournament.round_1_start);
  console.log('  Round 2 tee:', tournament.round_2_start);
  console.log('  Round 3 tee:', tournament.round_3_start);
  console.log('  Round 4 tee:', tournament.round_4_start);
  console.log('');
  
  // 3. Check the competition type template
  const { data: compType } = await supabase
    .from('competition_types')
    .select('*')
    .eq('id', comp.competition_type_id)
    .single();
    
  console.log('📋 Competition Type Template:');
  console.log('  Name:', compType.name);
  console.log('  Round Start:', compType.round_start, '(should use Round', compType.round_start, 'tee time)');
  console.log('');
  
  // 4. Calculate what it SHOULD be
  const roundField = `round_${compType.round_start}_start`;
  const correctTeeTime = tournament[roundField];
  const correctStartAt = correctTeeTime;
  const correctRegCloseAt = new Date(new Date(correctTeeTime).getTime() - 15 * 60000).toISOString();
  
  console.log('✅ What Final Strike SHOULD have:');
  console.log('  start_at:', correctStartAt, '(from', roundField, ')');
  console.log('  reg_close_at:', correctRegCloseAt, '(15 mins before)');
  console.log('');
  
  console.log('❌ What Final Strike ACTUALLY has:');
  console.log('  start_at:', comp.start_at, '← WRONG!');
  console.log('  reg_close_at:', comp.reg_close_at);
  console.log('');
  
  // 5. Check when it was last modified
  const createdDate = new Date(comp.created_at);
  const updatedDate = new Date(comp.updated_at);
  
  console.log('📅 Timeline:');
  console.log('  Created:', createdDate.toLocaleString());
  console.log('  Updated:', updatedDate.toLocaleString());
  console.log('  Same?', comp.created_at === comp.updated_at ? 'YES (never edited)' : 'NO (was edited)');
  console.log('');
  
  // 6. Show the fix
  console.log('🔧 Fix SQL:');
  console.log(`UPDATE tournament_competitions`);
  console.log(`SET start_at = '${correctStartAt}',`);
  console.log(`    reg_close_at = '${correctRegCloseAt}'`);
  console.log(`WHERE id = '${comp.id}';`);
}

investigate().catch(console.error);
