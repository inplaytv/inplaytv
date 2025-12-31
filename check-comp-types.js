require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCompTypes() {
  const { data, error } = await supabase
    .from('competition_types')
    .select('id, name, slug, is_default')
    .order('name');
  
  if (error) {
    console.error(error);
    process.exit(1);
  }
  
  console.log('\n=== COMPETITION TYPES ===\n');
  console.table(data);
  
  const mainSlugs = ['full-course', 'beat-the-cut', 'the-weekender', 'round-1', 'round-2', 'round-3'];
  const matches = data.filter(ct => mainSlugs.includes(ct.slug));
  
  console.log(`\nMatching main competition types: ${matches.length}`);
  console.table(matches);
  
  process.exit(0);
}

checkCompTypes();
