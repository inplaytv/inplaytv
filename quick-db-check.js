// Quick test to see current database state
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mtlmjypmwdqrbvxgdpcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bG1qeXBtd2RxcmJ2eGdkcGNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDMxODk3MiwiZXhwIjoyMDQ5ODk0OTcyfQ.wl-_6jtUT-Rlt88R-z3_6yCPb8dLHQVNCcbjLdPW8EI'
);

async function quickCheck() {
  const now = new Date();
  
  const { data, error } = await supabase
    .from('tournament_competitions')
    .select(`
      id,
      status,
      reg_close_at,
      competition_types!inner(name),
      tournaments!inner(slug, name)
    `)
    .eq('tournaments.slug', 'alfred-dunhill-championship-2024');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== ALFRED DUNHILL - ACTUAL DATABASE STATE ===\n');
  console.log('Current Time:', now.toISOString());
  console.log('\nCompetitions:');
  
  data.forEach(comp => {
    const regClose = comp.reg_close_at ? new Date(comp.reg_close_at) : null;
    const isOpen = regClose && now < regClose;
    
    console.log(`\n${comp.competition_types.name}:`);
    console.log(`  Status in DB: ${comp.status}`);
    console.log(`  Reg Close At: ${comp.reg_close_at}`);
    if (regClose) {
      const hoursUntil = (regClose - now) / (1000 * 60 * 60);
      console.log(`  Hours Until Close: ${hoursUntil.toFixed(1)}`);
      console.log(`  IS OPEN: ${isOpen ? '✅ YES' : '❌ NO'}`);
      console.log(`  Should Display: ${isOpen ? 'REGISTRATION OPEN' : 'LIVE/IN PROGRESS'}`);
    }
  });
}

quickCheck();
