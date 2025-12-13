const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://mtlmjypmwdqrbvxgdpcn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10bG1qeXBtd2RxcmJ2eGdkcGNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMTg5NzIsImV4cCI6MjA0OTg5NDk3Mn0.JzNTGzOp9H7KT-cOa2jt9G19Vh-DLkP_7Bl0Ri8z-Fw'
);

async function checkData() {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      id,
      slug,
      name,
      description,
      tournament_competitions (
        id,
        status,
        reg_open_at,
        reg_close_at,
        start_at,
        competition_types (
          name,
          slug
        )
      )
    `)
    .eq('slug', 'alfred-dunhill-championship-2024')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  const now = new Date();
  console.log('\n=== ALFRED DUNHILL CHAMPIONSHIP ===');
  console.log('Tournament:', data.name);
  console.log('Description:', data.description);
  console.log('\nCurrent Time:', now.toISOString());
  console.log('\n--- COMPETITIONS ---');
  
  data.tournament_competitions.forEach(comp => {
    console.log(`\n${comp.competition_types.name}:`);
    console.log('  DB Status:', comp.status);
    console.log('  Reg Open:', comp.reg_open_at);
    console.log('  Reg Close:', comp.reg_close_at);
    console.log('  Start At:', comp.start_at);
    
    if (comp.reg_close_at) {
      const closeTime = new Date(comp.reg_close_at);
      const isOpen = now < closeTime;
      console.log(`  --> Is Open by Date? ${isOpen ? '✅ YES' : '❌ NO (closed)'}`);
      console.log(`  --> Should Show: ${isOpen ? 'REGISTRATION OPEN' : 'LIVE or CLOSED'}`);
    } else {
      console.log('  --> No reg_close_at set!');
    }
  });
}

checkData();
