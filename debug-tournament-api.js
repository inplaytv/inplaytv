require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 Testing tournament API query step-by-step...\n');
  
  // Step 1: Get tournaments (same as API)
  console.log('Step 1: Fetch tournaments');
  const { data: tournaments, error: tError } = await supabase
    .from('tournaments')
    .select('id, name, slug, status, is_visible, start_date')
    .eq('is_visible', true)
    .neq('status', 'draft');
  
  if (tError) {
    console.error('❌ Error:', tError);
    return;
  }
  
  console.log(`✅ Found ${tournaments.length} tournaments`);
  tournaments.forEach(t => {
    console.log(`   - ${t.name} (status: ${t.status}, visible: ${t.is_visible})`);
  });
  
  // Step 2: For first tournament, get competitions
  if (tournaments.length > 0) {
    const tournament = tournaments[0];
    console.log(`\nStep 2: Fetch competitions for "${tournament.name}"`);
    
    const { data: competitions, error: cError } = await supabase
      .from('tournament_competitions')
      .select(`
        id,
        status,
        competition_format,
        competition_type_id,
        entry_fee_pennies,
        competition_types (
          name
        )
      `)
      .eq('tournament_id', tournament.id)
      .eq('competition_format', 'inplay');
    
    if (cError) {
      console.error('❌ Error:', cError);
      return;
    }
    
    console.log(`✅ Found ${competitions.length} InPlay competitions`);
    competitions.forEach(c => {
      console.log(`   - ${c.competition_types?.name || 'Unknown'}`);
      console.log(`     format: ${c.competition_format}, status: ${c.status}, fee: $${(c.entry_fee_pennies / 100).toFixed(2)}`);
    });
    
    // Step 3: Check if any have reg_close_at > now
    console.log('\nStep 3: Check registration windows');
    const { data: withDates } = await supabase
      .from('tournament_competitions')
      .select('id, reg_open_at, reg_close_at, status, competition_types(name)')
      .eq('tournament_id', tournament.id)
      .eq('competition_format', 'inplay');
    
    const now = new Date();
    const openForReg = (withDates || []).filter(c => 
      c.reg_close_at && new Date(c.reg_close_at) > now
    );
    
    console.log(`✅ ${openForReg.length} competitions with registration still open`);
    openForReg.forEach(c => {
      console.log(`   - ${c.competition_types?.name}: closes at ${c.reg_close_at}`);
    });
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Tournaments found: ${tournaments.length}`);
  console.log(`   All have is_visible=true: ✓`);
  console.log(`   All have status != 'draft': ✓`);
  console.log(`   Next step: Check why API returns 404`);
})();
