require('dotenv').config({path:'./apps/admin/.env.local'});
const {createClient}=require('@supabase/supabase-js');
const s=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);
(async()=>{
  const{data,error}=await s.from('tournament_competitions')
    .select('id,status,reg_open_at,reg_close_at,start_at,competition_types(name,round_start)')
    .eq('tournament_id','3bf785ea-f600-467e-85d0-be711914369a')
    .order('start_at');
  if(error){console.error('Error:',error);process.exit(1);}
  console.log(JSON.stringify(data,null,2));
})()
