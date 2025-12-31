require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVisibility() {
  console.log('=== CHECKING TOURNAMENT VISIBILITY ===\n');

  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, is_visible, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log(`Found ${tournaments.length} most recent tournaments:\n`);
  
  tournaments.forEach(t => {
    const visibility = t.is_visible === true ? '✅ Visible' : 
                       t.is_visible === false ? '❌ Hidden' : 
                       '⚠️  NULL (hidden by default)';
    console.log(`${t.name}`);
    console.log(`  ID: ${t.id}`);
    console.log(`  Visibility: ${visibility}`);
    console.log(`  Created: ${new Date(t.created_at).toLocaleString()}\n`);
  });
}

checkVisibility()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
