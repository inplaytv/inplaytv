require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  try {
    // Find masters-2026 tournament
    const { data: tournament, error: tournError } = await supabase
      .from('tournaments')
      .select('id, name, slug')
      .eq('slug', 'masters-2026')
      .single();
    
    if (tournError) {
      console.error('Tournament not found:', tournError.message);
      return;
    }
    
    console.log('✓ Tournament:', tournament.name);
    console.log('  ID:', tournament.id);
    console.log('  Slug:', tournament.slug);
    
    // Find InPlay competitions for this tournament
    const { data: competitions, error: compError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        competition_type_id,
        competition_format,
        entry_fee_pennies,
        status,
        competition_types (name)
      `)
      .eq('tournament_id', tournament.id)
      .eq('competition_format', 'inplay');
    
    if (compError) {
      console.error('Competition query error:', compError.message);
      return;
    }
    
    console.log(`\n✓ Found ${competitions.length} InPlay competitions:\n`);
    
    competitions.forEach((comp, idx) => {
      console.log(`${idx + 1}. ${comp.competition_types?.name || 'Unknown Type'}`);
      console.log(`   ID: ${comp.id}`);
      console.log(`   Fee: £${comp.entry_fee_pennies / 100}`);
      console.log(`   Status: ${comp.status}`);
      console.log(`   URL: /clubhouse/build-team/${tournament.slug}?competition=${comp.id}\n`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
