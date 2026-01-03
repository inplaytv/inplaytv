require('dotenv').config({path:'./apps/admin/.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  // Get tournament with updated round tee times
  const{data:tournament}=await s.from('tournaments')
    .select('id,name,registration_opens_at,round_1_start,round_2_start,round_3_start,round_4_start')
    .eq('id','3bf785ea-f600-467e-85d0-be711914369a')
    .single();
  console.log('Tournament round times:');
  console.log('Round 1:', tournament.round_1_start);
  console.log('Round 2:', tournament.round_2_start);
  console.log('Round 3:', tournament.round_3_start);
  console.log('Round 4:', tournament.round_4_start);
  
  // Get all competitions for this tournament
  const{data:comps}=await s.from('tournament_competitions')
    .select('id,competition_types!inner(name,round_start)')
    .eq('tournament_id',tournament.id);
  
  console.log(`\nUpdating ${comps.length} competitions...`);
  const updates = [];
  const now = new Date();
  
  for(const comp of comps){
    const roundStart = comp.competition_types.round_start;
    const roundKey = `round_${roundStart}_start`;
    const teeTime = tournament[roundKey];
    if(!teeTime){
      console.log(`⚠️ No tee time for ${comp.competition_types.name} (Round ${roundStart})`);
      continue;
    }
    const regCloseAt = new Date(new Date(teeTime).getTime() - 15 * 60000);
    const status = now >= regCloseAt ? 'reg_closed' : (tournament.registration_opens_at && now >= new Date(tournament.registration_opens_at)) ? 'reg_open' : 'upcoming';
    
    await s.from('tournament_competitions').update({
      reg_open_at: tournament.registration_opens_at,
      reg_close_at: regCloseAt.toISOString(),
      start_at: teeTime,
      status: status
    }).eq('id', comp.id);
    
    console.log(`✅ ${comp.competition_types.name}: reg_close=${regCloseAt.toISOString()}, status=${status}`);
    updates.push({name: comp.competition_types.name, reg_close_at: regCloseAt.toISOString(), status});
  }
  
  console.log(`\n✅ Updated ${updates.length} competitions`);
})()
