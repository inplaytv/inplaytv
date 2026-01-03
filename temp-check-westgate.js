require('dotenv').config({path:'./apps/admin/.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const now = new Date();
  console.log('Current time:', now.toISOString());
  console.log('');
  
  const{data:comps}=await s.from('tournament_competitions')
    .select('id,status,reg_close_at,start_at,competition_format,competition_types(name,round_start)')
    .eq('tournament_id','3bf785ea-f600-467e-85d0-be711914369a')
    .eq('competition_format','inplay')
    .order('start_at');
  
  console.log('WESTGATE InPlay Competitions:');
  console.log('');
  comps.forEach(c=>{
    const closeDate = new Date(c.reg_close_at);
    const isOpen = now < closeDate;
    const shouldBe = isOpen ? 'reg_open' : 'reg_closed';
    const match = c.status === shouldBe || (c.status === 'live' && !isOpen);
    console.log(`${c.competition_types.name.padEnd(20)} Status: ${c.status.padEnd(15)} Closes: ${closeDate.toISOString()} ${match ? '✅' : '❌ WRONG'}`);
    if(!match) {
      console.log(`  -> Should be: ${shouldBe} (${isOpen ? 'OPEN' : 'CLOSED'})`);
    }
  });
})()
