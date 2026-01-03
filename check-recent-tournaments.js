require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTournaments() {
  console.log('\n🔍 Checking recent tournaments in database...\n');
  
  const { data, error } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, start_date, end_date, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No tournaments found in database!');
    process.exit(0);
  }

  console.log(`📊 Last ${data.length} Tournaments (ordered by creation date):\n`);
  
  data.forEach((t, i) => {
    console.log(`${i + 1}. ${t.name}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Slug: ${t.slug}`);
    console.log(`   Status: ${t.status}`);
    console.log(`   Start Date: ${t.start_date || 'NOT SET'}`);
    console.log(`   End Date: ${t.end_date || 'NOT SET'}`);
    console.log(`   Created: ${new Date(t.created_at).toLocaleString()}`);
    console.log('');
  });

  console.log(`✅ Total tournaments in database: ${data.length}\n`);
  process.exit(0);
}

checkTournaments();
