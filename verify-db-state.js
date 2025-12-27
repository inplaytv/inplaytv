const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './apps/admin/.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDatabase() {
  console.log('Checking database directly...\n');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const { data, error, count } = await supabase
    .from('tournaments')
    .select('*', { count: 'exact' })
    .order('start_date', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`\nTotal tournaments in database: ${count}\n`);
  
  data.forEach((t, idx) => {
    console.log(`${idx + 1}. ${t.name} (${t.status}) - ${t.id}`);
  });
  
  const completedCount = data.filter(t => t.status === 'completed').length;
  console.log(`\n⚠️  Completed tournaments still in DB: ${completedCount}`);
}

verifyDatabase();
