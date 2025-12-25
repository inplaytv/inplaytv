require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create client EXACTLY like the API route does
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIPattern() {
  console.log('Testing EXACT API route pattern...\n');

  // Exact same query as API route
  const { data: tournaments, error: tournamentsError } = await supabase
    .from('tournaments')
    .select('*')
    .order('start_date', { ascending: true });

  console.log('Result:', tournaments?.length, 'tournaments');
  console.log('Error:', tournamentsError);
  
  console.log('\nTournament names:');
  tournaments?.forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} (${t.id})`);
  });
  
  const hasGreenidge = tournaments?.find(t => t.name === 'THE GREENIDGE OPEN');
  console.log('\nGREENIDGE OPEN included:', !!hasGreenidge);
}

testAPIPattern().catch(console.error);
