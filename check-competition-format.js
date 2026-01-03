require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFormats() {
  console.log('Checking competition_format field...\n');
  
  const { data: tournaments } = await supabase
    .from('tournaments')
    .select('id, name, slug')
    .in('slug', ['the-greenidge-open', 'westgate-birchington-golf-club']);
  
  for (const tournament of tournaments || []) {
    console.log(`\n=== ${tournament.name} ===`);
    
    const { data: comps } = await supabase
      .from('tournament_competitions')
      .select(`
        competition_format,
        status,
        competition_type_id,
        competition_types (name)
      `)
      .eq('tournament_id', tournament.id);
    
    console.log(`Total competitions: ${comps?.length || 0}`);
    
    const inplayCount = comps?.filter(c => c.competition_format === 'inplay').length || 0;
    const nullCount = comps?.filter(c => c.competition_format === null).length || 0;
    const one2oneCount = comps?.filter(c => c.competition_format === 'one2one').length || 0;
    
    console.log(`  - InPlay format: ${inplayCount}`);
    console.log(`  - ONE 2 ONE format: ${one2oneCount}`);
    console.log(`  - NULL format: ${nullCount}`);
    
    if (nullCount > 0) {
      console.log('\n  ⚠️  Competitions with NULL format:');
      comps?.filter(c => c.competition_format === null).forEach(c => {
        console.log(`    - ${c.competition_types?.name || 'Unknown'} (Status: ${c.status})`);
      });
    }
  }
}

checkFormats().then(() => process.exit(0));
