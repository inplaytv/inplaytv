require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function removeDuplicates() {
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id')
    .ilike('name', '%freeflo%')
    .single();
  
  const { data: comps } = await supabase
    .from('tournament_competitions')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('created_at');
  
  console.log(`\nFound ${comps.length} competitions (expected 6)`);
  
  // Keep first 6, delete the rest
  const toDelete = comps.slice(6).map(c => c.id);
  
  if (toDelete.length > 0) {
    console.log(`\nDeleting ${toDelete.length} duplicate competitions...`);
    await supabase.from('tournament_competitions').delete().in('id', toDelete);
    console.log('✅ Duplicates removed!');
  }
  
  process.exit(0);
}

removeDuplicates();
