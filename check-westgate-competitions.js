require('dotenv').config({ path: './apps/golf/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWestgateCompetitions() {
  console.log('Current time:', new Date().toISOString());
  console.log('\n========================================');
  console.log('CHECKING WESTGATE COMPETITIONS');
  console.log('========================================\n');

  // Get WESTGATE tournament
  const { data: tournament } = await supabase
    .from('tournaments')
    .select('id, name, slug, end_date')
    .eq('slug', 'westgate-birchington-golf-club')
    .single();

  if (!tournament) {
    console.log('WESTGATE tournament not found');
    return;
  }

  console.log('Tournament:', tournament.name);
  console.log('Tournament end_date:', tournament.end_date);
  console.log('Tournament ended:', new Date() > new Date(tournament.end_date));

  // Get all competitions for WESTGATE
  const { data: competitions } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_open_at,
      reg_close_at,
      start_at,
      end_at,
      competition_types (
        name
      )
    `)
    .eq('tournament_id', tournament.id)
    .eq('competition_format', 'inplay');

  console.log('\n========================================');
  console.log('ALL COMPETITIONS:');
  console.log('========================================\n');

  const now = new Date();

  competitions.forEach(comp => {
    const typeName = Array.isArray(comp.competition_types) 
      ? comp.competition_types[0]?.name 
      : comp.competition_types?.name;
    
    console.log(`\n${typeName}:`);
    console.log(`  status: ${comp.status}`);
    console.log(`  reg_close_at: ${comp.reg_close_at}`);
    console.log(`  start_at: ${comp.start_at}`);
    console.log(`  end_at: ${comp.end_at}`);
    
    // Check registration
    if (comp.reg_close_at) {
      const regClosed = now >= new Date(comp.reg_close_at);
      console.log(`  → Registration CLOSED: ${regClosed ? 'YES' : 'NO'}`);
    }
    
    // Check if live by dates
    if (comp.start_at && comp.end_at) {
      const started = now >= new Date(comp.start_at);
      const ended = now > new Date(comp.end_at);
      console.log(`  → Started: ${started ? 'YES' : 'NO'}`);
      console.log(`  → Ended: ${ended ? 'YES' : 'NO'}`);
      console.log(`  → Should be visible (status='live' + dates): ${comp.status === 'live' && started && !ended ? 'YES' : 'NO'}`);
    }
    
    // Apply isRegistrationOpen logic
    const regOpen = comp.reg_close_at ? now < new Date(comp.reg_close_at) : true;
    console.log(`  → isRegistrationOpen(): ${regOpen ? 'YES' : 'NO'}`);
    
    // Apply isCompetitionVisible logic
    let visible = false;
    if (regOpen) {
      visible = true;
      console.log(`  → isCompetitionVisible(): YES (registration open)`);
    } else if (comp.status === 'live') {
      if (comp.start_at && now < new Date(comp.start_at)) {
        console.log(`  → isCompetitionVisible(): NO (status='live' but not started)`);
      } else if (comp.end_at && now > new Date(comp.end_at)) {
        console.log(`  → isCompetitionVisible(): NO (status='live' but ended)`);
      } else {
        visible = true;
        console.log(`  → isCompetitionVisible(): YES (status='live' and dates valid)`);
      }
    } else {
      console.log(`  → isCompetitionVisible(): NO (not open, not live)`);
    }
  });

  // Check if tournament should be visible (NEW LOGIC - registration open ONLY)
  const anyVisible = competitions.some(comp => {
    const now = new Date();
    
    // Only check if registration is open
    const regOpen = comp.reg_close_at ? now < new Date(comp.reg_close_at) : true;
    return regOpen;
  });

  console.log('\n========================================');
  console.log(`TOURNAMENT SHOULD BE VISIBLE: ${anyVisible ? 'YES ❌' : 'NO ✅'}`);
  console.log('========================================\n');
}

checkWestgateCompetitions().catch(console.error);
