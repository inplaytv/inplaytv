require('dotenv').config({ path: './apps/admin/.env.local' });

async function calculateTimes() {
  const { data: tournament } = await (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ).from('tournaments').select('id').eq('slug', 'the-greenidge-open').single();
  
  if (!tournament) {
    console.log('Tournament not found');
    return;
  }
  
  const response = await fetch(`http://localhost:3002/api/tournaments/${tournament.id}/competitions/calculate-times`, {
    method: 'POST'
  });
  
  const result = await response.json();
  console.log('Result:', result);
}

calculateTimes();
