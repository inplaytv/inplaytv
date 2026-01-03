require('dotenv').config({path:'./apps/golf/.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const{data:comps}=await s.from('tournament_competitions')
    .select('id,status,reg_close_at,competition_types(name)')
    .eq('tournament_id','3bf785ea-f600-467e-85d0-be711914369a')
    .order('reg_close_at');
  console.log('WESTGATE Competitions (after fix):');
  comps.forEach(c=>{
    const closeDate = new Date(c.reg_close_at);
    const now = new Date();
    const isOpen = now < closeDate;
    console.log(`${c.competition_types.name}: ${c.status} (closes ${closeDate.toLocaleString('en-GB')}) - ${isOpen ? '✅ OPEN' : '❌ CLOSED'}`);
  });
})()
